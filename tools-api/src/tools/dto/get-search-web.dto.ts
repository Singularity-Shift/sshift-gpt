import { ApiProperty } from '@nestjs/swagger';

export class GetSearchWebDto {
  @ApiProperty({
    description: 'Error status',
    example: false,
  })
  error: boolean;

  @ApiProperty({
    description: 'Search result',
    example: 'https://www.google.com/search?q=test+search',
    required: false,
  })
  result?: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Failed to fetch search result. Please try again later.',
    required: false,
  })
  message?: string;
}
