import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { ChatController } from './chat.controlletr';

@Module({
  imports: [UserModule],
  controllers: [ChatController],
  exports: [],
})
export class ChatModule {}
