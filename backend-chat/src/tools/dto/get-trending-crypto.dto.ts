import { ApiProperty } from '@nestjs/swagger';

export class GetTrendingCryptoDto {
  @ApiProperty({
    description: 'the name of the crypto',
    example: 'Bitcoin',
  })
  name: string;
  @ApiProperty({
    description: 'the symbol of the crypto',
    example: 'BTC',
  })
  symbol: string;
  @ApiProperty({
    description: 'market cap rank of the crypto',
    example: 30000000000,
  })
  market_cap_rank: number;
  @ApiProperty({
    description: 'the price change percentage in the last 24 hours',
    example: 24,
  })
  price_change_percentage_24h?: number;
}
