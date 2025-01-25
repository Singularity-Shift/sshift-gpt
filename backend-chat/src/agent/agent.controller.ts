import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UserAuth, UserService } from '@nest-modules';
import { IUserAuth } from '@helpers';
import { AgentGuard } from './agent.guard';
import { Response } from 'express';

@Controller('agent')
export class AgentController {
  constructor(private readonly userService: UserService) {}
  @Post()
  @UseGuards(AgentGuard)
  async newMessage(
    @Body() createMessageDto: CreateMessageDto,
    @UserAuth() userAuth: IUserAuth,
    @Res() res: Response
  ) {
    const chat = await this.userService.updateChat(
      userAuth.address,
      createMessageDto.message
    );

    let currentToolCalls = [];
    let assistantMessage = { content: '', images: [] };

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

    // Add system prompt at the beginning of the messages array
    const messagesWithSystemPrompt = [
      {
        role: 'developer',
        content: systemPrompt || 'You are a helpful assistant.',
      },
      ...formattedMessages,
    ];

    // Set up response headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    try {
      const stream = await openai.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: messagesWithSystemPrompt,
        max_completion_tokens: 16384,
        temperature,
        stream: true,
        tools: toolSchema,
        tool_choice: 'auto',
        parallel_tool_calls: true,
      });

      for await (const chunk of stream) {
        // Check if we should stop the stream
        if (shouldStopStream()) {
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
          writeResponseChunk(chunk, res);
          res.flush();
        } else if (chunk.choices[0]?.delta?.tool_calls) {
          const isToolCall = await handleToolCall(chunk, currentToolCalls);
          if (isToolCall) {
            res.write(`data: ${JSON.stringify({ tool_call: true })}\n\n`);
            res.flush();
          }
        } else if (chunk.choices[0]?.finish_reason === 'tool_calls') {
          // Add the assistant's message with tool calls to the history
          const assistantToolMessage = {
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
          const toolResults = await processToolCalls(
            currentToolCalls,
            userConfig,
            auth,
            signal
          );
          messagesWithSystemPrompt.push(...toolResults);

          // Create continuation with the updated message history
          const continuationResponse = await openai.chat.completions.create({
            model: model || 'gpt-4o-mini',
            messages: messagesWithSystemPrompt,
            max_tokens: 16384,
            temperature,
            stream: true,
          });

          for await (const continuationChunk of continuationResponse) {
            // Check if we should stop during continuation
            if (shouldStopStream()) {
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
              writeResponseChunk(continuationChunk, res);
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
}
