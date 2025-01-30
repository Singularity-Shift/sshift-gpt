import { ApiProperty } from '@nestjs/swagger';
import { TrendingDto } from './trending.dto';

export class GetTrendingDto {
  static fromJson(
    users: TrendingDto[],
    page: number,
    total: number,
    totalPages: number
  ): GetTrendingDto {
    return new GetTrendingDto(users, page, total, totalPages);
  }

  @ApiProperty({
    description: 'Array of trending users',
    type: [TrendingDto],
  })
  users: TrendingDto[];

  @ApiProperty({
    description: 'Page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'total users',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'Total pages',
    example: 50,
  })
  totalPages: number;

  constructor(
    users: TrendingDto[],
    page: number,
    total: number,
    totalPages: number
  ) {
    this.users = users;
    this.page = page;
    this.total = total;
    this.totalPages = totalPages;
  }
}
