import { Controller, Get, Query } from '@nestjs/common';
import { HandleFinderService } from './handle-finder.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { TopicDto } from './dto/topic.dto';
import { TokenDto } from './dto/token.dto';
import { CategoryDto } from './dto/category.dto';

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
  async findAllTopics(): Promise<TopicDto[]> {
    return this.handleFinderService.findAllTopics();
  }

  @Get('tokens/mentions')
  @ApiQuery({ name: 'limit', type: 'number', required: false, example: 15 })
  @ApiQuery({ name: 'page', type: 'number', required: false, example: 1 })
  @ApiOperation({ summary: 'Get token' })
  @ApiResponse({
    description: 'find tokens mentioned',
    type: [TokenDto],
    status: 200,
  })
  async findTokensMentioned(
    @Query('limit') limit = 15,
    @Query('page') page = 1
  ): Promise<TokenDto[]> {
    return this.handleFinderService.findTokensMentioned(limit, page);
  }

  @Get('categories')
  @ApiQuery({ name: 'date', type: Date, required: true })
  @ApiOperation({ summary: 'Get category topic counts' })
  @ApiResponse({
    description: 'Category topic counts',
    type: [TopicDto],
    status: 200,
  })
  async findCategoryTopicCounts(
    @Query('date') date: string
  ): Promise<CategoryDto[]> {
    return this.handleFinderService.findCategoryTopicCounts(new Date(date));
  }
}
