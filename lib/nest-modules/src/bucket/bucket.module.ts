import { Module } from '@nestjs/common';
import { BucketService } from './bucket.service';
import { StorageModule } from '../storage/storage.module';
import { BucketController } from './bucket.controller';

@Module({
  imports: [StorageModule],
  controllers: [BucketController],
  providers: [BucketService],
  exports: [BucketService],
})
export class BucketModule {}
