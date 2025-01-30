import { ApiProperty } from '@nestjs/swagger';

export class GetUserNftsCollectionsDto {
  @ApiProperty({
    description: 'The id of the user',
    example: '0x0000000000000000000000000000000000000001',
  })
  id: string;

  @ApiProperty({
    description: 'slug of the collection',
    example: 'my-collection',
  })
  slug;

  @ApiProperty({
    description: 'title of the collection',
    example: 'My Collection',
  })
  title;

  @ApiProperty({
    description: 'Cover url of the collection',
    example: 'https://example.com/cover.jpg',
  })
  cover_url;

  @ApiProperty({
    description: 'floor price of the collection',
    example: 10,
  })
  floor;

  @ApiProperty({
    description: 'verified status of the collection',
    example: true,
  })
  verified;

  @ApiProperty({
    description: 'volume price of the collection',
    example: 50,
  })
  volume;
}
