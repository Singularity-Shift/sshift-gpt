import {
  AdminConfigModule,
  ConfigModule,
  GPTModule,
  UserModule,
} from '@nest-modules';
import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { HttpModule } from '@nestjs/axios';
import { OpenAI } from 'openai';
import { IdeogramModule } from '../ideogram/ideogram.module';

@Module({
  imports: [
    GPTModule,
    UserModule,
    AdminConfigModule,
    HttpModule,
    ConfigModule,
    IdeogramModule,
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    {
      provide: OpenAI,
      useFactory: () => {
        return new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      },
    },
  ],
})
export class AgentModule {}
