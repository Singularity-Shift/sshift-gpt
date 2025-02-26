import { HumanMessage } from '@langchain/core/messages';
import { CompiledStateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { createReactAgentAnnotation } from '@langchain/langgraph/dist/prebuilt/react_agent_executor';
import { Injectable } from '@nestjs/common';
import { GetActionDto } from './dto/get-action.dto';
import { executeAction } from '@helpers';
import { Account } from '@aptos-labs/ts-sdk';
import { AgentRuntime, LocalSigner } from 'move-agent-kit_spiel';
import { aptos } from '@aptos';

@Injectable()
export class AptosOnchainService {
  constructor(
    private readonly onchainAgent: CompiledStateGraph<
      (typeof MessagesAnnotation)['State'],
      (typeof MessagesAnnotation)['Update'],
      any,
      typeof MessagesAnnotation.spec,
      ReturnType<typeof createReactAgentAnnotation>['spec']
    >
  ) {}

  public async getAction(prompt: string) {
    const result = await this.onchainAgent.invoke(
      {
        messages: [new HumanMessage(prompt)],
      },
      { configurable: { thread_id: 'Aptos Agent Kit!' } }
    );

    return result.messages
      .flatMap((message) => message.additional_kwargs.tool_calls)
      .filter((tools) => tools?.type === 'function')
      .map((tool) => tool.function);
  }

  public async getResponses(actions: GetActionDto[], walletAddress: string) {
    const signer = new LocalSigner({} as Account);

    const agent = new AgentRuntime(signer, aptos);

    const responses = [];

    for (const action of actions) {
      const response = await executeAction(
        action.name,
        action.args,
        agent,
        walletAddress
      );

      responses.push(response);
    }

    return responses;
  }
}
