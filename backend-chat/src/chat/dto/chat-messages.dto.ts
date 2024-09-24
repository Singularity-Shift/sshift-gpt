import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
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
    type: [ChatContentDto],
  })
  @Type(() => ChatContentDto)
  @ValidateNested({ each: true })
  content: ChatContentDto[];
}
