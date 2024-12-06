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
import { IUserAuth, FeatureType } from '@helpers';
import { FeatureActivityDto } from './dto/credits-used.dto';
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
    type: FeatureActivityDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not found user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async UpdateFeatureActivity(
    @Body() creditsUsedDto: FeatureActivityDto,
    @UserAuth() userAuth: IUserAuth
  ) {
    const user = await this.userService.findUserByAddress(userAuth.address);

    if (!user) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exits`
      );
    }

    const updateResult = await this.userService.updateFeatureActivity(
      userAuth.address.toLocaleLowerCase(),
      creditsUsedDto
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
    let duration = 0;

    if (
      userConfig.subscriptionPlan?.startDate &&
      userConfig.subscriptionPlan?.endDate
    ) {
      const startDate = new Date(
        userConfig.subscriptionPlan.startDate
      ).getTime();
      const endDate = userConfig.subscriptionPlan.endDate;
      duration = Math.floor((endDate - startDate) / (60 * 60 * 24));
    }

    return GetUserConfigDto.fromJson(
      userAuth.address,
      userConfig,
      userConfig.subscriptionPlan.modelsUsed.map((m) =>
        FeatureActivityDto.fromJson(m, FeatureType.Models)
      ),
      userConfig.subscriptionPlan.toolsUsed.map((t) =>
        FeatureActivityDto.fromJson(t, FeatureType.Tools)
      ),
      duration
    );
  }
}
