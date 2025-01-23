import { Module } from '@nestjs/common';
import { ToolsModule } from './tools/tools.module';
import { HandleFinderModule } from './handle-finder/handle-finder.module';
import { ConfigModule, ConfigService } from '@nest-modules';
import { MongooseModule } from '@nestjs/mongoose';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
