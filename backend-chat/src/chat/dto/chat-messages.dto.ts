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
    description: 'Image URLs',
    example: ['https://example.com/image1.png', 'https://example.com/image2.png'],
    required: false,
    isArray: true,
  })
  @IsOptional()
  images: string[];
}
