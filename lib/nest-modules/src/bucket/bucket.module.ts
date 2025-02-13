import { Module } from '@nestjs/common';
import { BucketService } from './bucket.service';
import { BucketController } from './bucket.controller';
import { ConfigModule, UserModule } from '@nest-modules';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    StorageModule,
  ],
  controllers: [BucketController],
  providers: [BucketService],
  exports: [BucketService],
})
export class BucketModule {}
