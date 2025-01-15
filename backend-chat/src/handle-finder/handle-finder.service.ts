import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { TopicDto } from './dto/topic.dto';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../share/config/config.service';
import { TokenDto } from './dto/token.dto';
import { CategoryDto } from './dto/category.dto';
import { PublicationDto } from './dto/publication.dto';
import { UserTrendingDto } from './dto/user-trending.dto';
import { GetTrendingDto } from './dto/get-trending.dto';

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

  async findAllTopics(): Promise<TopicDto[]> {
    const response = await firstValueFrom(
      await this.httpService.get<TopicDto[]>(`${this.url}/llm/topics`, {
        headers: {
          ApiKey: this.apiKey,
          Address: this.address,
        },
      })
    );

    return response.data;
  }

  async findTokensMentioned(limit: number, page: number): Promise<TokenDto[]> {
    const response = await firstValueFrom(
      await this.httpService.get<TokenDto[]>(
        `${this.url}/llm/tokens/mentions?limit=${limit}&page=${page}`,
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
