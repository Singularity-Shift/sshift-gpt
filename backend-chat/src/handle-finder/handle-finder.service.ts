import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { TopicDto } from './dto/topic.dto';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../share/config/config.service';
import { TokenDto } from './dto/token.dto';
import { CategoryDto } from './dto/category.dto';

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

  async findCategoryTopicCounts(date: Date): Promise<CategoryDto[]> {
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
}
