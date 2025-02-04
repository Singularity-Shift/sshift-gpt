import { ApiProperty } from '@nestjs/swagger';

export class MarketDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the market',
  })
  id: number;
  @ApiProperty({
    example: '0x00000000000000000000000000000000000000000',
    description: 'Address of the market',
  })
  address: string;
  @ApiProperty({
    example: 'Base',
    description: 'Name of the chain',
  })
  chain: string;
  @ApiProperty({
    example: 'uniswap-v3-base',
    description: 'Market identifier',
  })
  identifier: string;

  @ApiProperty({
    example: '1',
    description: 'Token identifier for the coin',
  })
  tokenId: number;
}
