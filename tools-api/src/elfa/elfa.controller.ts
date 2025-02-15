import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ElfaService } from './elfa.service';

@Controller('elfa')
@ApiBearerAuth('Authorization')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal server error' })
export class ElfaController {
  constructor(private readonly elfaService: ElfaService) {}

  @Get('mentions')
  async findMetions(
    @Query('limit') limit: number,
    @Query('offset') offset: number
  ) {
    return await this.elfaService.findMetions(limit, offset);
  }

  @Get('top-mentions')
  async findTopMentions(
    @Query('ticker') ticker: string,
    @Query('timeWindow') timeWindow: string,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('includeAccountDetails') includeAccountDetails: boolean
  ) {
    return await this.elfaService.findTopMentions(
      ticker,
      timeWindow,
      page,
      pageSize,
      includeAccountDetails
    );
  }

  @Get('trending-tokens')
  async findTrendingMentions(
    @Query('timeWindow') timeWindow: string,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('minMentions') minMentions: number
  ) {
    return await this.elfaService.findTrendingTokens(
      timeWindow,
      page,
      pageSize,
      minMentions
    );
  }
}
