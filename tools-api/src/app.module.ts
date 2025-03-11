import { Module } from '@nestjs/common';
import { ToolsModule } from './tools/tools.module';
import { HandleFinderModule } from './handle-finder/handle-finder.module';
import {
  AuthGuard,
  AuthModule,
  ConfigModule,
  ConfigService,
  StorageModule,
  UserModule,
} from '@nest-modules';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ElfaModule } from './elfa/elfa.module';
import { IdeogramModule } from './ideogram/ideogram.module';
import { AptosOnchainModule } from './aptos-onchain/aptos-onchain.module';

@Module({
  imports: [
    ToolsModule,
    HandleFinderModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.get<string>('mongo.uri'),
        };
      },
    }),
    AuthModule,
    StorageModule,
    ConfigModule,
    UserModule,
    ElfaModule,
    IdeogramModule,
    AptosOnchainModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
