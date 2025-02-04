import { ApiProperty } from '@nestjs/swagger';
import { TokenCategoryDto } from './token-category.dto';
import { MarketDto } from './market.dto';
import { PriceDto } from './price.dto';

export class TrendingTokensStatsDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the token',
  })
  id: number;

  @ApiProperty({
    example: 'base',
    description: 'Name of the chain',
  })
  chain: string;

  @ApiProperty({
    example: 'ETH',
    description: 'Symbol of the token',
  })
  symbol: string;

  @ApiProperty({
    example: 'Ethereum',
    description: 'Name of the token',
  })
  name: string;

  @ApiProperty({
    example: 'Blockchain governance token',
    description: 'Description of the token',
  })
  description: string;

  @ApiProperty({
    example: 18,
    description: 'Decimals of the token',
  })
  decimals: number;

  @ApiProperty({
    example: 'https://example.com/image.png',
    description: 'Image URL of the token',
  })
  image: string;

  @ApiProperty({
    example: 'https://x.com/ethereum',
    description: 'Twitter URL of the token',
  })
  twitter: string;

  @ApiProperty({
    example: 'https://t.me/ethereum',
    description: 'Telegram URL of the token',
  })
  telegram: string;

  @ApiProperty({
    example: 'https://github.com/ethereum',
    description: 'Github URL of the token',
  })
  website: string;

  @ApiProperty({
    example: '2022-01-01',
    description: 'Genesis date',
  })
  genesisDate: string;

  @ApiProperty({
    example: '0x0000000000000000000000000000000000000000',
    description: 'Address of the token',
  })
  address: string;

  @ApiProperty({
    type: [TokenCategoryDto],
    description: 'Caterories of the token',
  })
  categories: TokenCategoryDto[];

  @ApiProperty({
    type: [MarketDto],
    description: 'Markets where the token is listed',
  })
  markets: MarketDto[];

  @ApiProperty({
    type: PriceDto,
    description: 'Price changes',
  })
  price: PriceDto;

  @ApiProperty({
    example: 1000000,
    description: 'Total of buyers',
  })
  buyers: string;
}
