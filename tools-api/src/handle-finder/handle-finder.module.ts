import { AdminConfigModule, ConfigModule, UserModule } from '@nest-modules';
import { Module } from '@nestjs/common';
import { HandleFinderService } from './handle-finder.service';
import { HandleFinderController } from './handle-finder.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, HttpModule, AdminConfigModule, UserModule],
  providers: [HandleFinderService],
  controllers: [HandleFinderController],
  exports: [],
})
export class HandleFinderModule {}
