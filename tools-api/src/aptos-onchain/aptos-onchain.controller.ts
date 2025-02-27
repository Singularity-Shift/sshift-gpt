import { BadGatewayException, Body, Controller, Post } from '@nestjs/common';
import { AptosOnchainService } from './aptos-onchain.service';
import { ActionsDto } from './dto/actions.dto';
import { ApiResponse } from '@nestjs/swagger';
import { GetActionDto } from './dto/get-action.dto';
import { ToolsNameList } from 'move-agent-kit_spiel';
import { UserAuth } from '@nest-modules';
import { Chain, IUserAuth } from '@helpers';

@Controller('onchain-agent')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal server error' })
export class AptosOnchainController {
  constructor(private readonly aptosOnchainService: AptosOnchainService) {}

  @Post()
  async getAction(
    @Body() actionDto: ActionsDto,
    @UserAuth() userAuth: IUserAuth
  ) {
    if (userAuth.chain !== Chain.Aptos) {
      throw new BadGatewayException(
        'For now only Aptos chain is supported for executing onchain actions' as string
      );
    }

    const actionsWithResponses: ToolsNameList[] = [
      'aptos_get_wallet_address',
      'aptos_token_details',
      'aptos_balance',
      'aptos_token_price',
      'joule_get_user_position',
      'joule_get_user_all_positions',
    ];

    const actions = await this.aptosOnchainService.getAction(actionDto.prompt);

    const actionsFormated = actions.map(GetActionDto.fromJson);

    if (
      actionsFormated.some((action) =>
        actionsWithResponses.includes(action.name)
      )
    ) {
      return this.aptosOnchainService.getResponses(
        actionsFormated,
        userAuth.address
      );
    }

    return actionsFormated;
  }
}
