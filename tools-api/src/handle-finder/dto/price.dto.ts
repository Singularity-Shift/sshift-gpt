import { ApiProperty } from '@nestjs/swagger';

export class PriceDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the coin',
  })
  id: number;

  @ApiProperty({
    example: '0x00000000000000000000000000000000000000000',
    description: 'Address of the coin',
  })
  address: string;

  @ApiProperty({
    example: 'Base',
    description: 'Name of the chain',
  })
  chain: string;

  @ApiProperty({
    example: '10',
    description: 'price in USD',
  })
  priceUsd: number;

  @ApiProperty({
    example: '100',
    description: 'highest price in USD',
  })
  ath: number;

  @ApiProperty({
    example: '5',
    description: 'lowest price in USD',
  })
  atl: number;

  @ApiProperty({
    example: '100000000',
    description: 'market cap in USD',
  })
  marketCap: number;

  @ApiProperty({
    example: '10',
    description: 'price change in percentage in the last 24 hours',
  })
  priceChangePercentage24h: number;

  @ApiProperty({
    example: '-10',
    description: 'price change in percentage in the last 7 days',
  })
  priceChangePercentage7d: number;

  @ApiProperty({
    example: '13',
    description: 'price change in percentage in the last 14 days',
  })
  priceChangePercentage14d: number;

  @ApiProperty({
    example: '35',
    description: 'price change in percentage in the last 30 days',
  })
  priceChangePercentage30d: number;

  @ApiProperty({
    example: '120',
    description: 'price change in percentage in the last 60 days',
  })
  priceChangePercentage60d: number;

  @ApiProperty({
    example: '20',
    description: 'price change in percentage in the last 200 days',
  })
  priceChangePercentage200d: number;

  @ApiProperty({
    example: '50',
    description: 'price change in percentage in the last year',
  })
  priceChangePercentage1y: number;

  @ApiProperty({
    example: '2022-01-01T00:00:00.000Z',
    description: 'when the coin was created',
  })
  createdAt: string;

  @ApiProperty({
    example: '1',
    description: 'Token identifier for the coin',
  })
  tokenId: number;
}
