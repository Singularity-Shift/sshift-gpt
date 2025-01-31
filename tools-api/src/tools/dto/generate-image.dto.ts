import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GenerateImageDto {
  @ApiProperty({
    description: 'The prompt to generate the image',
    example: 'A painting of a sunset with a sky filled with colors.',
  })
  @IsString()
  prompt: string;

  @ApiProperty({
    description: 'The size of the generated image',
    example: '1024x1792',
  })
  @IsString()
  size: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' | null;

  @ApiProperty({
    description: 'The style of the generated image',
    example: 'natural',
  })
  @IsString()
  style: 'vivid' | 'natural' | null;
}
