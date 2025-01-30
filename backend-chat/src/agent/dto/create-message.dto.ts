import { ChatHistoryDto, NewMessageDto } from '@nest-modules';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Content of the message',
    type: ChatHistoryDto,
  })
  @Type(() => NewMessageDto)
  @ValidateNested()
  message: NewMessageDto;

  @ApiProperty({
    description: 'Model of the chat',
    example: 'GPT-4o-mini',
  })
  model: string;

  @ApiProperty({
    description: 'Temperature of the chat',
    example: 0.7,
  })
  temperature: number;
}
