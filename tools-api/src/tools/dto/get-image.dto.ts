import { IImage } from '@helpers';
import { ApiProperty } from '@nestjs/swagger';

export class GetImageDto {
  static fromJson(json: IImage) {
    return new GetImageDto(json.url, json.prompt);
  }

  @ApiProperty({
    description: 'The image url',
    example: 'https://example.com/image.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'The prompt for the image',
    example: 'A beautiful sunset',
  })
  prompt: string;

  constructor(url: string, prompt: string) {
    this.url = url;
    this.prompt = prompt;
  }
}
