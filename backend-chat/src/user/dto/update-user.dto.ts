import { ChatHistoryDto } from '../../chat/dto/chat-history.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'chat history of this aptos account',
    type: [ChatHistoryDto],
  })
  @Type(() => ChatHistoryDto)
  @ValidateNested({ each: true })
  chats: ChatHistoryDto[];
}
