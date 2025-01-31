import { ApiProperty } from '@nestjs/swagger';

export class UserTrendingDto {
  @ApiProperty({
    description: 'Number of pages',
    example: 1,
  })
  page: number;
  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
  })
  limit: number;
  @ApiProperty({
    description: 'Ratio of likes, collects, or follows',
    enum: ['Likes', 'Collects', 'Followers'],
  })
  ratio: 'Collects' | 'Followers' | 'Likes';
  @ApiProperty({
    description: 'Protocol of the lens',
    enum: ['Lens', 'Farcaster'],
  })
  protocol: 'Lens' | 'Farcaster';
}
