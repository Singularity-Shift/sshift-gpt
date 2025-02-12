import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { HandleFinderService } from './handle-finder.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { TopicDto } from './dto/topic.dto';
import { GetCategoryDto } from './dto/get-category.dto';
import { PublicationDto } from './dto/publication.dto';
import { UserTrendingDto } from './dto/user-trending.dto';
import { GetTrendingDto } from './dto/get-trending.dto';
import { TrendingDto } from './dto/trending.dto';
import { TrendingTokensStatsDto } from './dto/trending-tokens-stats.dto';

@Controller('handle-finder')
@ApiBearerAuth('Authorization')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal server error' })
export class HandleFinderController {
  constructor(private readonly handleFinderService: HandleFinderService) {}

  @Get('topics')
  @ApiOperation({ summary: 'Find all topics' })
  @ApiResponse({
    description: 'All topics',
    type: [TopicDto],
    status: 200,
  })
  async findAllTopics(@Query('date') date: string): Promise<TopicDto[]> {
    return this.handleFinderService.findAllTopics(date);
  }

  @Get('tokens/stats')
  @ApiQuery({ name: 'limit', type: 'number', required: false, example: 15 })
  @ApiQuery({ name: 'page', type: 'number', required: false, example: 1 })
  @ApiOperation({ summary: 'Get token' })
  @ApiResponse({
    description: 'find tokens mentioned',
    type: [TrendingTokensStatsDto],
    status: 200,
  })
  async findTrendingTokenStats(
    @Query('limit') limit = 15,
    @Query('page') page = 1
  ): Promise<TrendingTokensStatsDto[]> {
    return this.handleFinderService.findTrendingTokenStats(limit, page);
  }

  @Get('categories')
  @ApiQuery({ name: 'date', type: Date, required: true })
  @ApiOperation({ summary: 'Get category topic counts' })
  @ApiResponse({
    description: 'Category topic counts',
    type: [GetCategoryDto],
    status: 200,
  })
  async findCategoryTopicCounts(
    @Query('date') date: string
  ): Promise<GetCategoryDto[]> {
    const response = await this.handleFinderService.findCategoryTopicCounts(
      date
    );

    return response.map(GetCategoryDto.fromJson);
  }

  @Get('categories/publications')
  @ApiQuery({
    name: 'category',
    type: String,
    required: true,
    example: 'Blockchain',
  })
  @ApiQuery({
    name: 'date',
    type: String,
    required: true,
    example: '2022-01-01',
  })
  @ApiQuery({ name: 'limit', type: 'number', required: false, example: 15 })
  @ApiQuery({ name: 'page', type: 'number', required: false, example: 1 })
  @ApiOperation({ summary: 'Get publications by category' })
  @ApiResponse({
    description: 'Publications by category',
    type: [PublicationDto],
    status: 200,
  })
  async findPublicationsByCategory(
    @Query('category') category: string,
    @Query('date') date: string,
    @Query('limit') limit = 15,
    @Query('page') page = 1
  ): Promise<PublicationDto[]> {
    return this.handleFinderService.findPublicationsByCategory(
      category,
      date,
      limit,
      page
    );
  }

  @Post('trending/users')
  @ApiOperation({ summary: 'Get trending users' })
  @ApiResponse({
    description: 'Trending users',
    status: 201,
    type: GetTrendingDto,
  })
  async findTrendingUsers(
    @Body() userTrendingDto: UserTrendingDto
  ): Promise<GetTrendingDto> {
    const response = await this.handleFinderService.findTrendingUsers(
      userTrendingDto
    );

    return {
      ...response,
      users: response.users.map((user) =>
        TrendingDto.fromJson(user, userTrendingDto.protocol)
      ),
    };
  }
}
