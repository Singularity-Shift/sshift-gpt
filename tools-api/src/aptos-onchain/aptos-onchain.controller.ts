import { Body, Controller, Post } from '@nestjs/common';
import { AptosOnchainService } from './aptos-onchain.service';
import { ActionsDto } from './dto/actions.dto';
import { ApiResponse } from '@nestjs/swagger';
import { GetActionDto } from './dto/get-action.dto';

@Controller('onchain-agent')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal server error' })
export class AptosOnchainController {
  constructor(private readonly aptosOnchainService: AptosOnchainService) {}

  @Post()
  async getAction(@Body() actionDto: ActionsDto) {
    const actions = await this.aptosOnchainService.getAction(actionDto.prompt);

    return actions.map(GetActionDto.fromJson);
  }
}
