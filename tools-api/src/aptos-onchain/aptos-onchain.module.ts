import { OnchainAgentModule } from '@nest-modules';
import { Module } from '@nestjs/common';
import { AptosOnchainService } from './aptos-onchain.service';
import { AptosOnchainController } from './aptos-onchain.controller';

@Module({
  imports: [OnchainAgentModule],
  providers: [AptosOnchainService],
  controllers: [AptosOnchainController],
})
export class AptosOnchainModule {}
