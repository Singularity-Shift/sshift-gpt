import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { UserAuth } from '../auth/auth.decorator';
import { IUserAuth, ReqType } from '@helpers';
import { ReqUsedDto } from './dto/req-used.dto';
import { GetUserConfigDto } from './dto/get-user-config.dto';

@Controller('user')
export class UserController {
  logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  @Put()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Update request use',
  })
  @ApiResponse({
    status: 201,
    description: 'Updated request use',
    type: ReqUsedDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not found user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async UpdateReqUsed(
    @Body() reqUsedDto: ReqUsedDto,
    @UserAuth() userAuth: IUserAuth
  ) {
    const user = await this.userService.findUserByAddress(userAuth.address);

    if (!user) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exits`
      );
    }

    const updateResult = await this.userService.updateReqUsed(
      userAuth.address.toLocaleLowerCase(),
      reqUsedDto
    );

    return updateResult;
  }

  @Get()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Get user config',
  })
  @ApiResponse({
    status: 200,
    description: 'User config',
    type: GetUserConfigDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not found user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async GetUserConfig(@UserAuth() userAuth: IUserAuth) {
    const userConfig = userAuth.config;

    return GetUserConfigDto.fromJson(
      userAuth.address,
      userConfig,
      userConfig.subscriptionPlan.modelsUsed.map((m) =>
        ReqUsedDto.fromJson(m, ReqType.Model)
      ),
      userConfig.subscriptionPlan.toolsUsed.map((t) =>
        ReqUsedDto.fromJson(t, ReqType.Tool)
      )
    );
  }
}
