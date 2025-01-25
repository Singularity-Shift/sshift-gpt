import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { ChatMessagesDto } from './chat-messages.dto';
import { Type } from 'class-transformer';
import { ChatUsageDto } from './chat-usage.dto';

export class NewMessageDto {
  @ApiProperty({
    description: 'Id of the chat',
    example: '2',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Chat title',
    example: 'My first chat',
  })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'AI model used in this chat',
    example: 'gpt-4o-mini"',
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Fingerprint of the system',
    example: 'fp_44709d6fcb',
  })
  system_fingerprint: string;

  @ApiProperty({
    description: 'Messages of the chat',
    type: ChatMessagesDto,
  })
  @Type(() => ChatMessagesDto)
  @ValidateNested()
  message: ChatMessagesDto;

  @ApiProperty({
    description: 'Chat usage',
    type: ChatUsageDto,
  })
  @ValidateNested()
  usage: ChatUsageDto;

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
