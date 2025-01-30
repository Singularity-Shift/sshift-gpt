import { ApiProperty } from '@nestjs/swagger';

export class RawDto {
  @ApiProperty({
    description: 'Raw image URI',
    example: 'https://example.com/image.jpg',
  })
  uri: string;
}
