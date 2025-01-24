import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UserAuth, UserService } from '@nest-modules';
import { IUserAuth } from '@helpers';
import { AgentGuard } from './agent.guard';

@Controller('agent')
export class AgentController {
  constructor(private readonly userService: UserService) {}
  @Post()
  @UseGuards(AgentGuard)
  async newMessage(
    @Body() createMessageDto: CreateMessageDto,
    @UserAuth() userAuth: IUserAuth
  ) {
    const chat = await this.userService.updateChat(
      userAuth.address,
      createMessageDto.message
    );
  }
}
