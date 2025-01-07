import { ApiProperty } from '@nestjs/swagger';

export class TrendingCollectionDto {
  @ApiProperty({
    description: 'The title of the collection',
    example: 'Qribbles',
  })
  title: string;

  @ApiProperty({
    description: 'The floor price of the collection',
    example: '0.14',
  })
  floor_price: string;
}
