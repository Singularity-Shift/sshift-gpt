import { ApiProperty } from '@nestjs/swagger';

export class TokenDto {
  @ApiProperty({
    description: 'Token ID',
    example: 'ea6c61db-a94c-4cb6-b8e4-3ebec76535ac',
  })
  id: string;
  @ApiProperty({
    description: 'Token name',
    example: 'ETH',
  })
  token: string;
  @ApiProperty({
    description: 'Date of token mentioned',
    example: '2025-01-10',
  })
  date: Date;
  @ApiProperty({
    description: 'Number of posts where the token is mentioned',
    example: '100',
  })
  post_count: number;
}
