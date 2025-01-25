import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { AdminConfigService, UserAuth, UserService } from '@nest-modules';
import { IUserAuth } from '@helpers';
import { AgentGuard } from './agent.guard';
import { Response } from 'express-stream';
import { OpenAI } from 'openai';
import toolSchema from './tool_schema.json';
import { ChatCompletionMessageParam } from 'openai/resources';
import { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
  private shouldStopStream = false;
  private controller = new AbortController();

  constructor(
    private readonly userService: UserService,
    private readonly adminConfigService: AdminConfigService,
    private readonly agentService: AgentService,
    private readonly openai: OpenAI
  ) {}
  @Post()
  @UseGuards(AgentGuard)
  async newMessage(
    @Body() createMessageDto: CreateMessageDto,
    @UserAuth() userAuth: IUserAuth,
    @Res() res: Response
  ) {
    const { model, message, temperature } = createMessageDto;

    this.controller = new AbortController();

    const chat = await this.userService.updateChat(userAuth.address, message);

    let currentToolCalls = [];
    const assistantMessage = { content: '', images: [] };

    // Format messages to handle images properly
    const formattedMessages = chat.messages.map((msg) => {
      if (msg.role === 'user' && msg.images?.length) {
        return {
          role: 'user',
          content: [
            {
              type: 'text',
              text: msg.content || "Here's an image.",
            },
            ...msg.images.map((image) => ({
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'auto',
              },
            })),
          ],
        };
      }
      // Handle messages that are already properly formatted for images
      if (msg.role === 'user' && Array.isArray(msg.content)) {
        return msg;
      }
      // Handle regular text messages
      return {
        role: msg.role || 'user',
        content: msg.content || '',
      };
    });

    const adminConfig = await this.adminConfigService.findAdminConfig();

    const systemPrompt = adminConfig.systemPrompt;

    // Add system prompt at the beginning of the messages array
    const messagesWithSystemPrompt = [
      {
        role: 'developer',
        content: systemPrompt || 'You are a helpful assistant.',
      },
      ...formattedMessages,
    ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

    // Set up response headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    try {
      const stream = await this.openai.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: messagesWithSystemPrompt,
        max_completion_tokens: 16384,
        temperature,
        stream: true,
        tools: toolSchema as OpenAI.Chat.Completions.ChatCompletionTool[],
        tool_choice: 'auto',
        parallel_tool_calls: true,
      });

      for await (const chunk of stream) {
        // Check if we should stop the stream
        if (this.shouldStopStream) {
          // Send final message and end stream
          res.write(
            `data: ${JSON.stringify({
              final_message: {
                content: assistantMessage.content,
                images: assistantMessage.images,
              },
            })}\n\n`
          );
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        if (chunk.choices[0]?.delta?.content) {
          assistantMessage.content += chunk.choices[0].delta.content;
          this.writeResponseChunk(chunk, res);
          res.flush();
        } else if (chunk.choices[0]?.delta?.tool_calls) {
          const isToolCall = await this.handleToolCall(chunk, currentToolCalls);
          if (isToolCall) {
            res.write(`data: ${JSON.stringify({ tool_call: true })}\n\n`);
            res.flush();
          }
        } else if (chunk.choices[0]?.finish_reason === 'tool_calls') {
          // Add the assistant's message with tool calls to the history
          const assistantToolMessage: ChatCompletionMessageParam = {
            role: 'assistant',
            content: assistantMessage.content,
            tool_calls: currentToolCalls.map((call) => ({
              id: call.id,
              type: 'function',
              function: {
                name: call.function.name,
                arguments: call.function.arguments,
              },
            })),
          };

          messagesWithSystemPrompt.push(assistantToolMessage);

          // Process tool calls and add their results to the history
          const toolResults = await this.processToolCalls(
            currentToolCalls,
            userAuth
          );
          messagesWithSystemPrompt.push(...toolResults);

          // Create continuation with the updated message history
          const continuationResponse =
            await this.openai.chat.completions.create({
              model: model || 'gpt-4o-mini',
              messages: messagesWithSystemPrompt,
              max_tokens: 16384,
              temperature,
              stream: true,
            });

          for await (const continuationChunk of continuationResponse) {
            // Check if we should stop during continuation
            if (this.shouldStopStream) {
              res.write(
                `data: ${JSON.stringify({
                  final_message: {
                    content: assistantMessage.content,
                    images: assistantMessage.images,
                  },
                })}\n\n`
              );
              res.write('data: [DONE]\n\n');
              res.end();
              return;
            }

            if (continuationChunk.choices[0]?.delta?.content) {
              assistantMessage.content +=
                continuationChunk.choices[0].delta.content;
              this.writeResponseChunk(continuationChunk, res);
              res.flush();
            }
          }

          currentToolCalls = [];
        } else if (chunk.choices[0]?.finish_reason === 'stop') {
          if (assistantMessage.content) {
            messagesWithSystemPrompt.push({
              role: 'assistant',
              content: assistantMessage.content,
            });
          }

          res.write(
            `data: ${JSON.stringify({
              final_message: {
                content: assistantMessage.content,
                images: assistantMessage.images,
              },
            })}\n\n`
          );
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
      }

      // Normal stream completion
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            final_message: {
              content: assistantMessage.content,
              images: assistantMessage.images,
            },
          })}\n\n`
        );
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (error) {
      console.error('Error in stream response:', error);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  }

  async handleToolCall(chunk, currentToolCalls) {
    if (chunk.choices[0]?.delta?.tool_calls) {
      const toolCall = chunk.choices[0].delta.tool_calls[0];

      if (!currentToolCalls.find((call) => call.index === toolCall.index)) {
        currentToolCalls.push({
          index: toolCall.index,
          id: toolCall.id,
          function: { name: '', arguments: '' },
        });
      }

      const currentCall = currentToolCalls.find(
        (call) => call.index === toolCall.index
      );

      if (toolCall.function) {
        if (toolCall.function.name) {
          currentCall.function.name = toolCall.function.name;
        }
        if (toolCall.function.arguments) {
          currentCall.function.arguments += toolCall.function.arguments;
        }
      }

      return true;
    }
    return false;
  }

  writeResponseChunk(chunk, res) {
    if (chunk.choices[0]?.delta?.content) {
      res.write(
        `data: ${JSON.stringify({
          content: chunk.choices[0].delta.content,
        })}\n\n`
      );
    }
  }

  async processToolCalls(currentToolCalls, userConfig: IUserAuth) {
    const results = [];

    // Set global userConfig for tool calls
    global.userConfig = userConfig;

    for (const toolCall of currentToolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        const toolFunction = this.agentService[toolCall.function.name];

        if (typeof toolFunction === 'function') {
          console.log(`Processing tool call: ${toolCall.function.name}`, args);

          const result = await toolFunction(
            ...Object.values(args),
            userConfig.auth,
            this.controller.signal
          );

          if (result.error) {
            console.error(
              `Tool call error for ${toolCall.function.name}:`,
              result.error
            );
            results.push({
              role: 'tool',
              content: JSON.stringify({
                error: true,
                message: result.message || 'Tool call failed',
              }),
              tool_call_id: toolCall.id,
            });
          } else {
            console.log(
              `Tool call success for ${toolCall.function.name}:`,
              result
            );

            // Special handling for image generation results
            if (toolCall.function.name === 'generateImage') {
              // Format the result to include both URL and prompt
              const formattedResult = {
                url: result.url,
                prompt: result.prompt,
                formatted_url: `![Generated Image](${result.url})`,
              };
              results.push({
                role: 'tool',
                content: JSON.stringify(formattedResult),
                tool_call_id: toolCall.id,
              });
            } else {
              results.push({
                role: 'tool',
                content: JSON.stringify(result),
                tool_call_id: toolCall.id,
              });
            }
          }
        }
      } catch (error) {
        console.error(
          `Error processing tool call ${toolCall.function.name}:`,
          error
        );
        results.push({
          role: 'tool',
          content: JSON.stringify({
            error: true,
            message: `Tool call failed: ${error.message}`,
          }),
          tool_call_id: toolCall.id,
        });
      }
    }

    // Clear global userConfig after tool calls are done
    global.userConfig = undefined;

    return results;
  }
}
