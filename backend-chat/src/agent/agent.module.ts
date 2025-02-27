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
  providers: [AgentService],
})
export class AgentModule {}
