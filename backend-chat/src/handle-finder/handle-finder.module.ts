import { ConfigModule } from '../share/config/config.module';
import { Module } from '@nestjs/common';
import { HandleFinderService } from './handle-finder.service';
import { HandleFinderController } from './handle-finder.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [HandleFinderService],
  controllers: [HandleFinderController],
  exports: [],
})
export class HandleFinderModule {}
