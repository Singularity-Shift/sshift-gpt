import {
  Controller,
  Logger,
  NotFoundException,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Param,
  Delete,
  Body,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { GetUserDto } from '../user/dto/get-user.dto';
import { UserAuth } from '../auth/auth.decorator';
import { IUserAuth } from '@helpers';
import { ChatHistoryDto } from './dto/chat-history.dto';

@Controller('history')
export class ChatController {
  logger = new Logger(ChatController.name);
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Create new chat',
  })
  @ApiResponse({
    status: 201,
    description: 'Created new chat',
    type: ChatHistoryDto,
  })
  async createChat(
    @UserAuth() userAuth: IUserAuth,
    @Body() newChat: ChatHistoryDto
  ): Promise<ChatHistoryDto> {
    return this.userService.addChat(userAuth.address, newChat);
  }

  @Get()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Get user chat history with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Response of user chat history',
    type: GetUserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1, min: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10, min: 1, max: 100)',
  })
  async getUserChatHistory(
    @UserAuth() userAuth: IUserAuth,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    const result = await this.userService.getUserChatsWithPagination(
      userAuth.address,
      page,
      limit
    );

    if (!result) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exist`
      );
    }

    return result;
  }

  @Get(':chatId/messages')
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Get paginated messages for a specific chat',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated messages for the specified chat',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
  })
  @ApiParam({
    name: 'chatId',
    description: 'ID of the chat to get messages from',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1, min: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of messages per page (default: 50, min: 1, max: 100)',
  })
  async getChatMessages(
    @UserAuth() userAuth: IUserAuth,
    @Param('chatId') chatId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number
  ) {
    const result = await this.userService.getChatMessagesWithPagination(
      userAuth.address,
      chatId,
      page,
      limit
    );

    if (!result) {
      throw new NotFoundException(
        `Chat with ID ${chatId} not found for user ${userAuth.address}`
      );
    }

    return result;
  }

  @Delete(':chatId')
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Delete a specific chat',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted',
    type: [ChatHistoryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
  })
  @ApiParam({
    name: 'chatId',
    description: 'ID of the chat to delete',
    type: String,
  })
  async deleteChat(
    @UserAuth() userAuth: IUserAuth,
    @Param('chatId') chatId: string
  ): Promise<ChatHistoryDto[]> {
    return this.userService.deleteChatById(userAuth.address, chatId);
  }

  @Delete()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Delete all chats for a user',
  })
  @ApiResponse({
    status: 200,
    description: 'All chats deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async deleteAllChats(@UserAuth() userAuth: IUserAuth) {
    await this.userService.deleteAllChatId(userAuth.address);
    this.logger.log(`All chats for user ${userAuth.address} deleted`);
  }
}
