import { ConfigService } from '@nest-modules';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ElfaService {
  private apiKey: string;
  private baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    this.apiKey = this.configService.get('elfa.apiKey');
    this.baseUrl = this.configService.get('elfa.baseUrl');
  }

  async findMetions(limit: number, offset: number) {
    const response = await firstValueFrom(
      await this.httpService.get(`${this.baseUrl}/mentions`, {
        headers: {
          'x-elfa-api-key': this.apiKey,
        },
        params: {
          limit,
          offset,
        },
      })
    );

    return response.data;
  }

  async findTopMentions(
    ticker: string,
    timeWindow: string,
    page: number,
    pageSize: number,
    includeAccountDetails: boolean
  ) {
    const response = await firstValueFrom(
      await this.httpService.get(`${this.baseUrl}/top-mentions`, {
        headers: {
          'x-elfa-api-key': this.apiKey,
        },
        params: {
          ticker,
          timeWindow,
          page,
          pageSize,
          includeAccountDetails,
        },
      })
    );

    return response.data;
  }

  async findTrendingTokens(
    timeWindow: string,
    page: number,
    pageSize: number,
    minMentions: number
  ) {
    const response = await firstValueFrom(
      await this.httpService.get(`${this.baseUrl}/trending-tokens`, {
        headers: {
          'x-elfa-api-key': this.apiKey,
        },
        params: {
          timeWindow,
          page,
          pageSize,
          minMentions,
        },
      })
    );

    return response.data;
  }
}
