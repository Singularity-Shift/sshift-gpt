import { Module } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { OpenAI } from 'openai';
import { ConfigModule } from '../config/config.module';

export const gptProvider = {
  provide: OpenAI,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const apiKey = configService.get<string>('openApi.apiKey');
    return new OpenAI({ apiKey });
  },
};

@Module({
  imports: [ConfigModule],
  providers: [gptProvider],
  exports: [OpenAI],
})
export class GPTModule {}
