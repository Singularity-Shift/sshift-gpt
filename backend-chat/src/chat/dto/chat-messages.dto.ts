import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ChatContentDto } from './chat-content.dto';

export class ChatMessagesDto {
  @ApiProperty({
    description: 'Role of the chat entity',
    example: 'system',
  })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'Message contents',
    type: String || [ChatContentDto],
  })
  content: string | ChatContentDto[];
}
