import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { ElevenLabsService } from './elevenlabs.service';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { WALLET_COLLECTIONS_QUERY } from '../indexer/indexer.queries';
import {
  ICmcInfo,
  ICollection,
  IImage,
  ISoundEffect,
  ITicker,
  transformCoverUrl,
} from '@helpers';
import { CreateSoundEffectDto } from './dto/create-sound-efect.dto';
import { GenerateImageDto } from './dto/generate-image.dto';
import { OpenAI } from 'openai';
import { BucketService } from './bucket.service';
import { CMCService } from './coin-market-cap.service';
import yahooFinance from 'yahoo-finance2';
import { ChartOptionsWithReturnObject } from 'yahoo-finance2/dist/esm/src/modules/chart';
import { StockInfoDto } from './dto/stockInfo.dto';

@Injectable()
export class ToolsService {
  private logger = new Logger(ToolsService.name);
  constructor(
    private readonly elevenLabsService: ElevenLabsService,
    private readonly storage: Storage,
    private readonly openApi: OpenAI,
    private readonly indexer: ApolloClient<NormalizedCacheObject>,
    private readonly bucketService: BucketService,
    private readonly cmcService: CMCService
  ) {}

  async createSoundEffect(
    createSoundEffectDto: CreateSoundEffectDto
  ): Promise<ISoundEffect> {
    const {
      text,
      duration_seconds = null,
      prompt_influence = 1.0,
    } = createSoundEffectDto;
    this.logger.log('Generating sound effect with prompt:', text);

    // Generate sound effect
    const audioBuffer = await this.elevenLabsService.generateSoundEffect(
      text,
      duration_seconds,
      prompt_influence
    );

    // Create a sanitized filename from the text
    const sanitizedText = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50);

    const filename = `${sanitizedText}-${uuidv4()}.mp3`;
    const bucketName = 'sshift-gpt-bucket';

    const bucket = this.storage.bucket(bucketName);
    const blob = bucket.file(filename);

    // Set up the upload with proper metadata
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000',
        prompt: text,
      },
    });

    const soundEffect = (await new Promise((resolve, reject) => {
      // Handle upload errors
      blobStream.on('error', (err) => {
        this.logger.error('Upload error:', err);
        reject({
          error: 'Failed to upload sound effect',
          details: err.message,
        });
      });

      // Handle upload success
      blobStream.on('finish', () => {
        try {
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

          this.logger.log('Upload successful:', publicUrl);
          resolve({
            url: publicUrl,
            duration_seconds: duration_seconds || 'auto',
            text: text,
            prompt: text,
            description: `Sound effect generated using the prompt: "${text}"`,
          });
        } catch (error) {
          this.logger.error('Error getting public URL:', error);
          reject({ error: 'Failed to get public URL', details: error.message });
        }
      });

      // Write the buffer to the upload stream
      blobStream.end(Buffer.from(audioBuffer));
    })) as ISoundEffect;

    this.logger.log('Sound effect created:', soundEffect);

    return soundEffect;
  }

  async fetchWalletItemsCollections(address: string): Promise<ICollection[]> {
    const { data } = await this.indexer.query({
      query: WALLET_COLLECTIONS_QUERY,
      variables: {
        where: {
          nfts: {
            _or: [{ owner: { _eq: address } }],
          },
        },
        order_by: [{ volume: 'desc' }],
      },
    });

    const collections = data?.aptos?.collections || [];
    return collections.map((collection) => ({
      ...collection,
      floor: collection.floor * Math.pow(10, -8), // Convert to APT
      volume: collection.volume * Math.pow(10, -8), // Convert to APT
      cover_url: transformCoverUrl(collection.cover_url),
    }));
  }
  async generateImage(generateImageDto: GenerateImageDto): Promise<IImage> {
    const { prompt, size, style } = generateImageDto;

    this.logger.log('Generating image with prompt:', prompt);
    this.logger.log('Size:', size);
    this.logger.log('Style:', style);

    const response = await this.openApi.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1, // Hardcoded to 1 image only
      size: size,
      style: style,
      response_format: 'url',
    });

    this.logger.log('OpenAI API response:', JSON.stringify(response, null, 2));

    if (!response.data || response.data.length === 0) {
      throw new Error('No image generated');
    }

    const imageUrl = response.data[0].url;

    this.logger.log('Image generated successfully:', imageUrl);

    const bucketUrl = (await this.bucketService.uploadImageToBucket(
      imageUrl
    )) as Pick<IImage, 'url'>;

    this.logger.log('Image uploaded to bucket:', bucketUrl);

    return {
      url: bucketUrl.url,
      prompt,
    };
  }

  async findCryptoInfoFromCMC(tokenSymbol: string): Promise<ICmcInfo> {
    return await this.cmcService.getFullCryptoInfo(tokenSymbol);
  }

  async getStockInfo(stockInfoDto: StockInfoDto) {
    const { tickers, info_types } = stockInfoDto;

    const result = await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const tickerResult = {} as ITicker;

          for (const infoType of info_types) {
            switch (infoType) {
              case 'current_price': {
                const quote = await yahooFinance.quote(ticker);
                tickerResult.current_price = quote.regularMarketPrice;
                break;
              }
              case 'splits': {
                const chartOptions: ChartOptionsWithReturnObject = {
                  period1: '1970-01-01',
                  interval: '1d',
                  events: 'splits',
                  return: 'object',
                };
                const chartData = await yahooFinance.chart(
                  ticker,
                  chartOptions
                );

                tickerResult.splits = chartData.events?.splits;
                break;
              }
              case 'dividends': {
                const divChartOptions: ChartOptionsWithReturnObject = {
                  period1: '1970-01-01',
                  interval: '1d',
                  events: 'dividends',
                  return: 'object',
                };
                const divData = await yahooFinance.chart(
                  ticker,
                  divChartOptions
                );
                tickerResult.dividends = divData.events?.dividends;
                break;
              }
              case 'company_info': {
                const quoteSummary = await yahooFinance.quoteSummary(ticker);
                tickerResult.company_info = {
                  ...quoteSummary.price,
                  ...quoteSummary.summaryProfile,
                  ...quoteSummary.summaryDetail,
                };
                break;
              }
              case 'financials': {
                const financials = await yahooFinance.quoteSummary(ticker, {
                  modules: ['financialData', 'incomeStatementHistory'],
                });
                tickerResult.financials = {
                  financialData: financials.financialData,
                  incomeStatement: financials.incomeStatementHistory,
                };
                break;
              }
              case 'recommendations': {
                const recommendations =
                  await yahooFinance.recommendationsBySymbol(ticker);
                tickerResult.recommendations = recommendations;
                break;
              }
            }
          }
          return tickerResult;
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
          result[ticker] = { error: error.message };
        }
      })
    );

    this.logger.log('Stock info fetched successfully:', result);

    return result;
  }
}
