import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  Get,
  Put,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
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
    description: 'Page number (default: 1, min: 1)'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of items per page (default: 10, min: 1, max: 100)'
  })
  async getUserChatHistory(
    @UserAuth() userAuth: IUserAuth,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
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
}
