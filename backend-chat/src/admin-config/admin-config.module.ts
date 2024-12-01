import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { AdminConfigSchema, AdminConfig } from './admin-config.schema';
import { AdminConfigService } from './admin-config.service';
import { AdminConfigController } from './admin-config.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminConfig.name, schema: AdminConfigSchema },
    ]),
  ],
  providers: [AdminConfigService],
  controllers: [AdminConfigController],
  exports: [],
})
export class AdminConfigModule {}
