import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ChatMessagesDto {
  @ApiProperty({
    description: 'Unique identifier for the message',
    example: '1704926547123',
  })
  @IsString()
  id: string;

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
    example: [
      'https://example.com/image1.png',
      'https://example.com/image2.png',
    ],
    required: false,
    isArray: true,
  })
  @IsOptional()
  images: string[];

  @ApiProperty({
    description: 'Timestamp when the message was created',
    example: 1704926547123,
  })
  timestamp: number;
}
