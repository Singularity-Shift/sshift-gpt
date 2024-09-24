import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { ChatImageContentDto } from './chat-image-content.dto';

export class ChatContentDto {
  @ApiProperty({
    description: 'type of the content',
    example: 'text',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'context in text type',
    example: 'hello world',
  })
  @IsString()
  @IsOptional()
  text: string;

  @ApiProperty({
    description: 'context in image type',
    type: ChatImageContentDto,
  })
  @ValidateNested()
  @IsOptional()
  image_url: ChatImageContentDto;
}
