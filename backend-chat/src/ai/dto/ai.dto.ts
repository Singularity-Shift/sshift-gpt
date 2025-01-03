import { ApiProperty } from '@nestjs/swagger';
import { ChatMessagesDto } from '../../chat/dto/chat-messages.dto';
import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AiDto {
  @ApiProperty({
    description: 'Messages of the chat',
    type: [ChatMessagesDto],
  })
  @Type(() => ChatMessagesDto)
  @ValidateNested({ each: true })
  messages: ChatMessagesDto[];

  @ApiProperty({
    description: 'AI model used in this chat',
    example: 'gpt-4o-mini"',
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Temperature of the AI model',
    example: 0.2,
    default: 0.2,
  })
  temperature: number;
}
