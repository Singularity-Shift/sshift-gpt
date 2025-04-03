import { ApiProperty } from '@nestjs/swagger';

export class CitationsDto {
  static fromMap(title: string, url: string): CitationsDto {
    return new CitationsDto(title, url);
  }

  @ApiProperty({
    type: String,
    description: 'Citation URL',
    example: 'https://www.youtube.com/watch?v=oijX1suWemQ',
  })
  url: string;

  @ApiProperty({
    type: String,
    description: 'Citation title',
    example: 'Youtube channel.',
  })
  title: string;

  constructor(title: string, url: string) {
    this.url = url;
    this.title = title;
  }
}
