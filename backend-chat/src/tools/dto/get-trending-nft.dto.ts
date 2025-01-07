import { ApiProperty } from '@nestjs/swagger';
import { TrendingCollectionDto } from './trending-collection.dto';

export class GetTrendingNFTDto {
  @ApiProperty({
    description: 'the status of the request',
    example: 'success',
  })
  status: string;
  @ApiProperty({
    description: 'the period for which the trends are requested',
    example: 'day',
    required: false,
  })
  period?: string;
  @ApiProperty({
    description: 'the type of nft to get trends for',
    example: 'crypto',
    required: false,
  })
  trending_by?: string;
  @ApiProperty({
    description: 'the limit of results to return',
    example: 10,
    required: false,
  })
  limit?: number;
  @ApiProperty({
    description: 'the data for the trending nfts',
    type: [TrendingCollectionDto],
    required: false,
  })
  data?: TrendingCollectionDto[];
  @ApiProperty({
    description: 'the error message if any',
    example: 'Failed to fetch trending nfts. Please try again later.',
    required: false,
  })
  message?: string;
}
