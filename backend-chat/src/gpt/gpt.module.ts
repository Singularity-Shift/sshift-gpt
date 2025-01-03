import { Module } from '@nestjs/common';
import { ConfigService } from '../share/config/config.service';
import { OpenAI } from 'openai';
import { ConfigModule } from '../share/config/config.module';

export type OpenAIProvider = OpenAI;

export const openApiProvider = {
  provide: OpenAI,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const apiKey = configService.get<string>('openApi.apiKey');
    return new OpenAI({ apiKey });
  },
};

@Module({
  imports: [ConfigModule],
  providers: [openApiProvider],
  exports: [OpenAI],
})
export class OpenAIModule {}
