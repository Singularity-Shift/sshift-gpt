import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  Get,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { GetUserDto } from '../user/dto/get-user.dto';
import { UserAuth } from '../auth/auth.decorator';
import { IUserAuth } from '@helpers';
import { ChatHistoryDto } from './dto/chat-history.dto';
import { Chat } from './chat.schema';

@Controller('history')
export class ChatController {
  logger = new Logger(ChatController.name);
  constructor(private readonly userService: UserService) {}

  @Put()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Update user chat history',
  })
  @ApiResponse({
    status: 201,
    description: 'User chat history update',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async updateUserChatHistory(
    @Body() chats: ChatHistoryDto[],
    @UserAuth() userAuth: IUserAuth
  ) {
    const user = await this.userService.findUserByAddress(userAuth.address);

    if (!user) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exist`
      );
    }

    await this.userService.updateUser(
      userAuth.address.toLowerCase(),
      chats
    );

    return GetUserDto.fromJson({
      ...user,
      chats: chats as Chat[],
    });
  }

  @Get()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Get user chat history with optional pagination',
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
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserChatHistory(
    @UserAuth() userAuth: IUserAuth,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const user = await this.userService.findUserByAddress(userAuth.address);

    if (!user) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exist`
      );
    }

    // If pagination parameters are provided, paginate the results
    if (page !== undefined && limit !== undefined) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedChats = user.chats.slice(startIndex, endIndex);
      
      return {
        chats: paginatedChats,
        total: user.chats.length,
        page,
        limit,
        totalPages: Math.ceil(user.chats.length / limit),
      };
    }

    // Return full chat history if no pagination parameters
    return GetUserDto.fromJson(user);
  }
}
