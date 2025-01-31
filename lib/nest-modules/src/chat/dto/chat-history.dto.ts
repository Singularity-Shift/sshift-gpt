import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { ChatMessagesDto } from './chat-messages.dto';
import { Type } from 'class-transformer';
import { ChatUsageDto } from './chat-usage.dto';

export class ChatHistoryDto {
  @ApiProperty({
    description: 'Id of the chat',
    example: '2',
  })
  id: string;

  @ApiProperty({
    description: 'Chat title',
    example: 'My first chat',
  })
  title: string;

  @ApiProperty({
    description: 'AI model used in this chat',
    example: 'gpt-4o-mini"',
  })
  model: string;

  @ApiProperty({
    description: 'Messages of the chat',
    type: ChatMessagesDto,
  })
  messages: ChatMessagesDto[];

  @ApiProperty({
    description: 'Timestamp when the chat was created',
    example: 1707123456789,
  })
  createdAt: number;

  @ApiProperty({
    description: 'Timestamp when the chat was last updated',
    example: 1707123456789,
  })
  lastUpdated: number;
}
