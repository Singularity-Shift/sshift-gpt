import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ChatMessagesDto } from './chat-messages.dto';
import { Transform, Type } from 'class-transformer';
import { ChatUsageDto } from './chat-usage.dto';
import { AIModel } from '@helpers';

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
  @IsEnum(AIModel)
  model: AIModel;

  @ApiProperty({
    description: 'Messages of the chat',
    type: ChatMessagesDto,
  })
  @Type(() => ChatMessagesDto)
  @ValidateNested()
  message: ChatMessagesDto;

  @ApiProperty({
    description: 'Timestamp when the chat was created',
    example: 1707123456789,
  })
  createdAt: number;

  @ApiProperty({
    description: 'Timestamp when the chat was last updated',
    example: 1707123456789,
  })
  @IsNumber()
  lastUpdated: number;

  @ApiProperty({
    description: 'temperature of the chat',
    example: 0.2,
  })
  @Transform(({ value }) => {
    return parseFloat(value || '0.2');
  })
  @IsNumber()
  @IsOptional()
  temperature: number;
}
