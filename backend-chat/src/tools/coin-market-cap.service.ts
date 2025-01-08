import { ICmcInfo } from '@helpers';
import { ConfigService } from '../share/config/config.service';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CMCService {
  logger = new Logger(CMCService.name);

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService
  ) {}

  async fetchFromCMC(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.configService.get<string>(
      'cmc.baseUrl'
    )}${endpoint}?${queryString}`;

    const headers = {
      Accepts: 'application/json',
      'X-CMC_PRO_API_KEY': this.configService.get<string>('cmc.apiKey'),
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers,
        })
      );

      return await response.data;
    } catch (error) {
      this.logger.error(`Error fetching from CMC (${endpoint}):`, error);
      return null;
    }
  }

  async getBasicInfo(symbol) {
    const data = await this.fetchFromCMC('/cryptocurrency/quotes/latest', {
      symbol: symbol,
      convert: 'USD',
    });
    return data?.data?.[symbol.toUpperCase()] || null;
  }

  async getMetadata(symbol) {
    const data = await this.fetchFromCMC('/cryptocurrency/info', {
      symbol: symbol,
    });
    return data?.data?.[symbol.toUpperCase()] || null;
  }

  async getMarketPairs(symbol) {
    const data = await this.fetchFromCMC(
      '/cryptocurrency/market-pairs/latest',
      {
        symbol: symbol,
      }
    );
    return data?.data?.market_pairs || null;
  }

  async getFullCryptoInfo(symbol): Promise<ICmcInfo> {
    const [basicInfo, metadata] = await Promise.all([
      this.getBasicInfo(symbol),
      this.getMetadata(symbol),
    ]);

    if (!basicInfo) {
      this.logger.error(
        `Could not find basic cryptocurrency data for symbol '${symbol}'`
      );
      throw new NotFoundException(
        `Could not find valid cryptocurrency data for symbol '${symbol}'`
      );
    }

    const quote = basicInfo.quote?.USD || {};
    const currentPrice = quote.price;
    const totalSupply = basicInfo.total_supply;
    const undilutedMarketCap =
      currentPrice && totalSupply ? currentPrice * totalSupply : null;

    const result = {
      market_cap: quote.market_cap,
      current_price: currentPrice,
      total_volume: quote.volume_24h,
      circulating_supply: basicInfo.circulating_supply,
      total_supply: totalSupply,
      undiluted_market_cap: undilutedMarketCap,
      description: metadata?.description,
      logo: metadata?.logo,
      urls: metadata?.urls || {},
      exchanges: [],
    };

    try {
      const marketPairs = await this.getMarketPairs(symbol);
      if (marketPairs) {
        result.exchanges = marketPairs.map((pair) => pair.exchange.name);
      }
    } catch (error) {
      this.logger.error('Error getting market pairs:', error);
      result.exchanges = []; // Empty array if market pairs unavailable
    }

    this.logger.log(
      `Fetched full cryptocurrency info for '${symbol}':`,
      result
    );

    return result;
  }
}
