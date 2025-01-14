import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { AdminConfigService } from './admin-config.service';
import { AdminConfigController } from './admin-config.controller';
import { AdminConfig, AdminConfigSchema } from './admin-config.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    CacheModule.register(),
    UserModule,
    MongooseModule.forFeature([
      { name: AdminConfig.name, schema: AdminConfigSchema },
    ]),
  ],
  controllers: [AdminConfigController],
  providers: [AdminConfigService],
  exports: [AdminConfigService],
})
export class AdminConfigModule {}
