import { ApiProperty } from '@nestjs/swagger';

export class TokenCategoryDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the category',
  })
  id: number;
  @ApiProperty({
    example: '0x00000000000000000000000000000000000000000',
    description: 'Address of the category',
  })
  address: string;
  @ApiProperty({
    example: 'Base',
    description: 'Name of the chain',
  })
  chain: string;
  @ApiProperty({
    example: 'Farcaster Ecosystem',
    description: 'Category identifier',
  })
  catergory: string;
  @ApiProperty({
    example: '1',
    description: 'Token identifier for the category',
  })
  tokenId: number;
}
