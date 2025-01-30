import { ApiProperty } from '@nestjs/swagger';

export class GetCryptoInfoFromCMCDto {
  @ApiProperty({
    description: 'the market cap of the crypto',
    example: 2200000000,
  })
  market_cap: number;
  @ApiProperty({
    description: 'the current price of the crypto',
    example: 3000,
  })
  current_price: number;
  @ApiProperty({
    description: 'the total volume of the crypto traded in 24 hours',
    example: 600000000000000,
  })
  total_volume: number;
  @ApiProperty({
    description: 'the circulating supply of the crypto',
    example: 100000000,
  })
  circulating_supply: number;
  @ApiProperty({
    description: 'the total supply of the crypto',
    example: 2100000000,
  })
  total_supply: number;
  @ApiProperty({
    description: 'the undiluted market cap of the crypto',
    example: 100000000,
  })
  undiluted_market_cap: number;
  @ApiProperty({
    description: 'the description of the crypto',
    example:
      'A decentralized, self-sustaining, and user-friendly blockchain platform',
  })
  description: string;
  @ApiProperty({
    description: 'the logo of the crypto',
    example: 'https://example.com/logo.png',
  })
  logo: string;
  @ApiProperty({
    description: 'the website of the crypto',
    example: 'https://example.com',
  })
  urls: unknown;
  @ApiProperty({
    description: 'the list of exchanges where the crypto is traded',
    example: ['Binance', 'Uniswap'],
  })
  exchanges: string[];
}
