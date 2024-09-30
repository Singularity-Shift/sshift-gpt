import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ChatMessagesDto {
  @ApiProperty({
    description: 'Role of the chat entity',
    example: 'system',
  })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'Message contents',
    example: 'Hello world',
  })
  content: string;

  @ApiProperty({
    description: 'Image url',
    example: 'https://example.com/image.png',
    required: false,
  })
  @IsOptional()
  image: string;
}
