import { Module } from '@nestjs/common';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { ElevenLabsService } from './elevenlabs.service';
import { HttpModule } from '@nestjs/axios';
import { CMCService } from './coin-market-cap.service';

import {
  ConfigModule,
  GPTModule,
  IndexerModule,
  StorageModule,
  AdminConfigModule,
  UserModule,
  BucketModule,
} from '@nest-modules';

@Module({
  imports: [
    ConfigModule,
    GPTModule,
    IndexerModule,
    StorageModule,
    HttpModule,
    AdminConfigModule,
    UserModule,
    BucketModule,
  ],
  controllers: [ToolsController],
  providers: [ToolsService, ElevenLabsService, CMCService],
  exports: [],
})
export class ToolsModule {}
