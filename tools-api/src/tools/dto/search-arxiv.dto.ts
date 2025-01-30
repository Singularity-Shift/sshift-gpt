import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class SearchArxivDto {
  @ApiProperty({
    description: 'Arxiv search query',
    example: 'Artificial Intelligence',
  })
  @IsString()
  search_query: string;
  @ApiProperty({
    description: 'Maximum number of results',
    example: 10,
  })
  @IsNumber()
  max_results: number;
  @ApiProperty({
    description: 'Sort order of results',
    example: 'relevance',
  })
  @IsString()
  sort_by: string;
  @ApiProperty({
    description: 'Sort order of results (ascending, descending)',
    example: 'descending',
  })
  @IsString()
  sort_order: string;
}
