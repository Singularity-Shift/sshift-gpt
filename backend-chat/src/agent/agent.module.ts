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

@Module({
  imports: [GPTModule, UserModule, AdminConfigModule, HttpModule, ConfigModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
