import { ApiProperty } from '@nestjs/swagger';

export class GetGeneratedImageDto {
  @ApiProperty({
    description: 'Prompt used to generate the image',
    example: 'A painting of a sunset with a sky filled with colors.',
  })
  prompt: string;

  @ApiProperty({
    description: 'Resolution of the generated image in pixels',
    example: '1024x1024',
  })
  resolution: number;

  @ApiProperty({
    description:
      'Safe status of the generated image (true if safe, false otherwise)',
    example: true,
  })
  is_image_safe: boolean;

  @ApiProperty({
    description: 'Generated image URL',
    example: 'https://example.com/image.png',
  })
  url: string;

  @ApiProperty({
    description:
      "Style type of the generated image (e.g., 'sketch', 'colorful')",
    example: 'REALISTIC',
  })
  style_type: string;
}
