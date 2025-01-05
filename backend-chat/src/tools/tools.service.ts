import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { Response } from 'express';
import { ElevenLabsService } from './elevenlabs.service';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { WALLET_COLLECTIONS_QUERY } from '../indexer/indexer.queries';
import { transformCoverUrl } from '@helpers';
import { CreateSoundEffectDto } from './dto/create-sound-efect.dto';
import { GenerateImageDto } from './dto/generate-image.dto';
import { OpenAI } from 'openai';
import { BucketService } from './bucket.service';

@Injectable()
export class ToolsService {
  private logger = new Logger(ToolsService.name);
  constructor(
    private readonly elevenLabsService: ElevenLabsService,
    private readonly storage: Storage,
    private readonly openApi: OpenAI,
    private readonly indexer: ApolloClient<NormalizedCacheObject>,
    private readonly bucketService: BucketService
  ) {}

  async createSoundEffect(
    createSoundEffectDto: CreateSoundEffectDto,
    res: Response
  ) {
    const { text, duration_seconds, prompt_influence } = createSoundEffectDto;
    this.logger.log('Generating sound effect with prompt:', text);

    // Generate sound effect
    const response = await this.elevenLabsService.generateSoundEffect(
      text,
      duration_seconds,
      prompt_influence
    );

    // Get the audio data as an ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

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

    // Handle upload errors
    blobStream.on('error', (err) => {
      this.logger.error('Upload error:', err);
      return res
        .status(500)
        .json({ error: 'Upload error', details: err.message });
    });

    // Handle upload success
    blobStream.on('finish', async () => {
      try {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

        this.logger.log('Upload successful:', publicUrl);
        return res.status(200).json({
          url: publicUrl,
          duration_seconds: duration_seconds || 'auto',
          text: text,
          prompt: text,
          description: `Sound effect generated using the prompt: "${text}"`,
        });
      } catch (error) {
        this.logger.error('Error getting public URL:', error);
        return res
          .status(500)
          .json({ error: 'Failed to get public URL', details: error.message });
      }
    });

    // Write the buffer to the upload stream
    blobStream.end(Buffer.from(audioBuffer));
  }

  async fetchWalletItemsCollections(address: string) {
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
  async generateImage(generateImageDto: GenerateImageDto, res: Response) {
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

    const bucketUrl = await this.bucketService.uploadImageToBucket(
      imageUrl,
      res
    );
    this.logger.log('Image uploaded to bucket:', bucketUrl);
  }
}
