import { ApiProperty } from '@nestjs/swagger';

export class StockInfoDto {
  @ApiProperty({
    description: 'The list of tickers',
    example: ['AAPL', 'GOOGL'],
  })
  tickers: string[];

  @ApiProperty({
    description: 'The list of information types',
    example: ['price', 'volume'],
  })
  info_types: string[];
}
