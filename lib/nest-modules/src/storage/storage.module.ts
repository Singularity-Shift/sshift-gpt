import { Module } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { ConfigModule } from '../config/config.module';
import { Storage } from '@google-cloud/storage';

export type StorageProvider = Storage;

export const storageProvider = {
  provide: Storage,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const credentialsBase64 = configService.get<string>(
      'storage.storageCredentials'
    ) as string;

    const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString(
      'utf-8'
    );

    const credentials = JSON.parse(credentialsJson);

    return new Storage({
      projectId: configService.get<string>('storage.project_id'),
      credentials,
    });
  },
};

@Module({
  imports: [ConfigModule],
  providers: [storageProvider],
  exports: [Storage],
})
export class StorageModule {}
