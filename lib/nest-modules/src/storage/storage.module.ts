import { Module } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { ConfigModule } from '../config/config.module';
import { Storage } from '@google-cloud/storage';

export type StorageProvider = Storage;

export const storageProvider = {
  provide: Storage,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return new Storage({
      projectId: configService.get<string>('storage.project_id'),
      credentials: {
        type: 'service_account',
        projectId: configService.get<string>('storage.project_id'),
        private_key: configService.get<string>('storage.private_key'),
        private_key_id: configService.get<string>('storage.private_key_id'),
        client_email: configService.get<string>('storage.client_email'),
        client_id: configService.get<string>('storage.client_id'),
        universe_domain: configService.get<string>('storage.universe_domain'),
      },
    });
  },
};

@Module({
  imports: [ConfigModule],
  providers: [storageProvider],
  exports: [Storage],
})
export class StorageModule {}
