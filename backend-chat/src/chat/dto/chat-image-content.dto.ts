import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChatImageContentDto {
  @ApiProperty({
    description: 'Url of the image',
    example: 'data:image/jpeg;base64,<placeholder>',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Image detail',
    example: 'high',
  })
  @IsString()
  detail: string;
}
