import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { TopicDto } from './dto/topic.dto';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nest-modules';
import { CategoryDto } from './dto/category.dto';
import { PublicationDto } from './dto/publication.dto';
import { UserTrendingDto } from './dto/user-trending.dto';
import { GetTrendingDto } from './dto/get-trending.dto';
import { TrendingTokensStatsDto } from './dto/trending-tokens-stats.dto';
import { Protocol } from '@helpers';

@Injectable()
export class HandleFinderService {
  url: string;
  address: string;
  apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.url = this.configService.get('handleFinder.baseUrl');
    this.address = this.configService.get('handleFinder.address');
    this.apiKey = this.configService.get('handleFinder.apiKey');
  }

  async findAllTopics(date: string, protocol: Protocol): Promise<TopicDto[]> {
    const response = await firstValueFrom(
      await this.httpService.get<TopicDto[]>(`${this.url}/llm/topics`, {
        headers: {
          ApiKey: this.apiKey,
          Address: this.address,
        },
        params: {
          date,
          protocol,
        },
      })
    );

    return response.data;
  }

  async findTrendingTokenStats(
    limit: number,
    page: number,
    protocol: Protocol
  ): Promise<TrendingTokensStatsDto[]> {
    const response = await firstValueFrom(
      await this.httpService.get<TrendingTokensStatsDto[]>(
        `${this.url}/trending/token-stats`,
        {
          headers: {
            ApiKey: this.apiKey,
          },
          params: {
            limit,
            page,
            protocol,
          },
        }
      )
    );

    return response.data;
  }

  async findCategoryTopicCounts(date: string): Promise<CategoryDto[]> {
    const response = await firstValueFrom(
      await this.httpService.get<CategoryDto[]>(`${this.url}/llm/categories`, {
        headers: {
          ApiKey: this.apiKey,
          Address: this.address,
        },
        params: {
          date,
        },
      })
    );

    return response.data;
  }

  async findPublicationsByCategory(
    category: string,
    date: string,
    limit: number,
    page: number
  ): Promise<PublicationDto[]> {
    const response = await firstValueFrom(
      await this.httpService.get<PublicationDto[]>(
        `${this.url}/llm/categories/publications`,
        {
          headers: {
            ApiKey: this.apiKey,
            Address: this.address,
          },
          params: {
            category,
            date,
            take: limit,
            page,
          },
        }
      )
    );

    return response.data;
  }

  async findTrendingUsers(
    userTrendingDto: UserTrendingDto
  ): Promise<GetTrendingDto> {
    const response = await firstValueFrom(
      await this.httpService.post<GetTrendingDto>(
        `${this.url}/trending/find`,
        userTrendingDto,
        {
          headers: {
            ApiKey: this.apiKey,
            Address: this.address,
          },
        }
      )
    );

    return response.data;
  }
}
