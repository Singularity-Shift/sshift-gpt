import { ConfigModule } from '../share/config/config.module';
import { Module } from '@nestjs/common';
import { ToolsController } from './tools.controller';
import { GPTModule } from '../gpt/gpt.module';
import { IndexerModule } from '../indexer/indexer.module';
import { StorageModule } from '../storage/storage.module';
import { ToolsService } from './tools.service';
import { BucketService } from './bucket.service';
import { ElevenLabsService } from './elevenlabs.service';
import { HttpModule } from '@nestjs/axios';
import { CMCService } from './coin-market-cap.service';
import { AdminConfigModule } from '../admin-config/admin-config.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule,
    GPTModule,
    IndexerModule,
    StorageModule,
    HttpModule,
    AdminConfigModule,
    UserModule,
  ],
  controllers: [ToolsController],
  providers: [ToolsService, ElevenLabsService, BucketService, CMCService],
  exports: [],
})
export class ToolsModule {}
