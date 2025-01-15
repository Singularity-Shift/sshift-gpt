import { ApiProperty } from '@nestjs/swagger';

export class OptimizedDto {
  @ApiProperty({
    description: 'Optimized picture URI',
    example: 'https://example.com/optimized_picture.jpg',
  })
  uri: string;
}
