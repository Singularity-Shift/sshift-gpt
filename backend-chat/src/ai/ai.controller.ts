import {
  Body,
  Controller,
  HttpException,
  Logger,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiDto } from './dto/ai.dto';
import { UserAuth } from '../auth/auth.decorator';
import { IUserAuth, IUserConfig } from '@helpers';
import { AiService } from './ai.service';
import { ChatMessagesDto } from '@fn-backend/chat/dto/chat-messages.dto';
import { systemPrompt } from './ai.prompt';
import { OpenAIProvider } from '@fn-backend/gpt/gpt.module';
import { Response } from 'express';


@Controller('ai')
@ApiBearerAuth('Authorization')
export class AiController {
  logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService,private readonly openApi: OpenAIProvider) {}
  @Post()
  @ApiOperation({ summary: 'Generate AI response' })
  async generateAiResponse(@Body() aiDto: AiDto, @UserAuth() user: IUserAuth, @Res() res: Response) {
    const { messages, temperature, model } = aiDto;
    this.logger.log(messages, 'Messages');

    try {
      if (!user.config.isCollector) {
        const hasEnoughCredit = await this.aiService.checkModelCredits(
          user.config.subscriptionPlan,
          model
        );
        if (!hasEnoughCredit) {
          throw new UnauthorizedException('Not enough credits for this model');
        }
      }

      // Start streaming the response
      await this.streamResponse(res, model, messages, temperature, user.config);
    } catch (error) {
      throw new HttpException(error, error.status || 500);
    }
  }

  private async streamResponse(res: Response, model: string, messages: ChatMessagesDto[], temperature: number, userConfig: IUserConfig) {
    let currentToolCalls = [];
    let assistantMessage = { content: '', images: [] };
    
    // Format messages to handle images properly
    const formattedMessages = messages.map(msg => {
        // Handle messages with images
        if (msg.role === 'user' && msg.image) {
            return {
                role: 'user',
                content: [
                    { 
                        type: 'text', 
                        text: msg.content || "Here's an image." 
                    },
                    { 
                        type: 'image_url', 
                        image_url: { 
                            url: msg.image,
                            detail: "auto"
                        } 
                    }
                ]
            };
        }
        // Handle messages that are already properly formatted for images
        if (msg.role === 'user' && Array.isArray(msg.content)) {
            return msg;
        }
        // Handle regular text messages
        return {
            role: msg.role || 'user',
            content: msg.content || ''
        };
    });

    // Add system prompt at the beginning of the messages array
    const messagesWithSystemPrompt = [
        systemPrompt,
        ...formattedMessages
    ];

    try {
        const stream = await this.openApi.chat.completions.create({
            model: model || 'gpt-4o-mini',
            messages: messagesWithSystemPrompt,
            max_tokens: 8192,
            temperature,
            stream: true,
            tools: toolSchema,
            tool_choice: "auto",
            parallel_tool_calls: true,
        });

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        for await (const chunk of stream) {
            if (chunk.choices[0]?.delta?.content) {
                assistantMessage.content += chunk.choices[0].delta.content;
                writeResponseChunk(chunk, res);
                res.flush();
            }
            else if (chunk.choices[0]?.delta?.tool_calls) {
                const isToolCall = await handleToolCall(chunk, currentToolCalls);
                if (isToolCall) {
                    res.write(`data: ${JSON.stringify({ tool_call: true })}\n\n`);
                    res.flush();
                }
            }
            else if (chunk.choices[0]?.finish_reason === 'tool_calls') {
                // Add the assistant's message with tool calls to the history
                const assistantToolMessage = {
                    role: 'assistant',
                    content: assistantMessage.content,
                    tool_calls: currentToolCalls.map(call => ({
                        id: call.id,
                        type: 'function',
                        function: {
                            name: call.function.name,
                            arguments: call.function.arguments
                        }
                    }))
                };
                messagesWithSystemPrompt.push(assistantToolMessage);

                // Process tool calls and add their results to the history
                const toolResults = await processToolCalls(currentToolCalls, userConfig, auth);
                messagesWithSystemPrompt.push(...toolResults);

                // Create continuation with the updated message history
                const continuationResponse = await openai.chat.completions.create({
                    model: model || 'gpt-4o-mini',
                    messages: messagesWithSystemPrompt,
                    max_tokens: 1000,
                    temperature,
                    stream: true,
                });

                for await (const continuationChunk of continuationResponse) {
                    if (continuationChunk.choices[0]?.delta?.content) {
                        assistantMessage.content += continuationChunk.choices[0].delta.content;
                        writeResponseChunk(continuationChunk, res);
                        res.flush();
                    }
                }

                currentToolCalls = [];
            }
            else if (chunk.choices[0]?.finish_reason === 'stop') {
                if (assistantMessage.content) {
                    messagesWithSystemPrompt.push({
                        role: 'assistant',
                        content: assistantMessage.content
                    });
                }

                res.write(`data: ${JSON.stringify({ 
                    final_message: {
                        content: assistantMessage.content,
                        images: assistantMessage.images
                    }
                })}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
                return;
            }
        }

        // Ensure we always send a final message
        if (!res.writableEnded) {
            if (assistantMessage.content) {
                messagesWithSystemPrompt.push({
                    role: 'assistant',
                    content: assistantMessage.content
                });
            }

            res.write(`data: ${JSON.stringify({ 
                final_message: {
                    content: assistantMessage.content,
                    images: assistantMessage.images
                }
            })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
        }

    } catch (error) {
        console.error('Error in stream response:', error);
        console.error('Current message history:', JSON.stringify(messagesWithSystemPrompt, null, 2));
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
        }
    }
    
}
