import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '../config/config.service';
import { CompiledStateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { createReactAgentAnnotation } from '@langchain/langgraph/dist/prebuilt/react_agent_executor';
import {
  AgentRuntime,
  createAptosTools,
  LocalSigner,
} from 'move-agent-kit-fullstack';
import { Account, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { StructuredToolInterface } from '@langchain/core/tools';

export type OnchainAgentProvider = CompiledStateGraph<
  (typeof MessagesAnnotation)['State'],
  (typeof MessagesAnnotation)['Update'],
  any,
  typeof MessagesAnnotation.spec,
  ReturnType<typeof createReactAgentAnnotation>['spec']
>;
export const onchainAgentProvider = {
  provide: CompiledStateGraph,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const signer = new LocalSigner({} as Account);

    const aptos = new Aptos(
      new AptosConfig({
        network: Network.MAINNET,
      })
    );

    const agent = new AgentRuntime(signer, aptos, {
      PANORA_API_KEY: configService.get<string>('panora.apiKey'),
    });

    const tools = createAptosTools(agent, {
      filter: [
        'aptos_transfer_token',
        'aptos_balance',
        'aptos_get_wallet_address',
        'aptos_create_token',
        'aptos_burn_token',
        'aptos_mint_token',
        'joule_lend_token',
        'joule_withdraw_token',
        'joule_borrow_token',
        'joule_repay_token',
        'joule_get_user_position',
        'joule_get_user_all_positions',
        'amnis_stake',
        'amnis_withdraw_stake',
        'panora_aggregator_swap',
        'panora_aggregator_list',
        'emojicoin_get_market',
        'emojicoin_provide_liquidity',
        'emojicoin_register_market',
        'emojicoin_remove_liquidity',
        'emojicoin_swap',
      ],
    }) as StructuredToolInterface[];

    const llm = new ChatOpenAI({
      temperature: 0.7,
      model: 'gpt-4o-mini',
      apiKey: configService.get<string>('openApi.apiKey'),
    });

    return createReactAgent({
      llm,
      tools,
      prompt: `You are a helpful agent that can interact onchain using the Aptos Agent Kit.
      You are empowered to interact onchain using your tools. If you ever need funds, you can request them from the faucet.
      If not, you can provide your wallet details and request funds from the user.
      If there is a 5XX (internal) HTTP error code, ask the user to try again later.

      Important:
      - If the user prompt asks for the balance of some tokens, call only the tool "aptos_balance".
      - If the user prompt asks for token details, call only the tool "panora_aggregator_list" for each token requested, including always the tokenAddress input.
      - If the user prompt asks for token price, call only the tool "panora_aggregator_price" for each token requested, including always the tokenAddress input.
      - If the user prompt asks for token list on Panora, call only the tool "panora_aggregator_list".
      - If the user prompt asks for the wallet address, call only the tool "aptos_get_wallet_address".
          
      If someone asks you to do something you can't do with your currently available tools,
      you must say so and encourage them to implement it themselves using the Aptos Agent Kit.
      Recommend they go to https://metamove.build/move-agent-kit for more information.
      Be concise and helpful with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.`,
    });
  },
};

@Module({
  imports: [ConfigModule],
  providers: [onchainAgentProvider],
  exports: [CompiledStateGraph],
})
export class OnchainAgentModule {}
