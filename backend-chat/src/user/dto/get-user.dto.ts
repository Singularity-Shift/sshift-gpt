import { ChatHistoryDto } from '../../chat/dto/chat-history.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { User } from '../user.schema';
import { Chat } from '../../chat/chat.schema';

export class GetUserDto {
  static fromJson(userSchema: User) {
    return new GetUserDto(userSchema.address, userSchema.chats);
  }

  @ApiProperty({
    description: 'Address of the aptos account',
    example:
      '0x1cdcbae7369dc8e159bc8bf951cfb7e7e168ef1bd56c169dcacb336b13657417',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'chat history of this aptos account',
    type: [ChatHistoryDto],
  })
  @Type(() => ChatHistoryDto)
  @ValidateNested({ each: true })
  chats: ChatHistoryDto[];

  constructor(address: string, chats: Chat[]) {
    this.address = address;
    this.chats = chats;
  }
}
