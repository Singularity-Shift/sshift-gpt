import { AdminConfigModule, GPTModule, UserModule } from '@nest-modules';
import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [GPTModule, UserModule, AdminConfigModule, HttpModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
