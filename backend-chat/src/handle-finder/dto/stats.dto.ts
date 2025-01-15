import { ApiProperty } from '@nestjs/swagger';

export class StatsDto {
  @ApiProperty({
    description: 'Followers count',
    example: 100,
  })
  followers: number;
  @ApiProperty({
    description: 'Following count',
    example: 200,
  })
  following: number;
  @ApiProperty({
    description: 'Lens classifier score',
    example: 0.8,
  })
  lensClassifierScore: number;
  @ApiProperty({
    description: 'Number of posts',
    example: 50,
  })
  posts: number;
}
