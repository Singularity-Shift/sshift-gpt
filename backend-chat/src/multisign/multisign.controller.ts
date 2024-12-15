import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { UserAuth } from '../auth/auth.decorator';
import { IUserAuth, MultisignAction } from '@helpers';
import { UpdateActionDto } from './dto/update-action.dto';
import { MultisignService } from './multisign.service';
import { GetActionDto } from './dto/get-action.dto';
import { CreateActionDto } from './dto/create-action.dto';

@Controller('multisign')
export class MultisignController {
  logger = new Logger(MultisignController.name);
  constructor(
    private readonly userService: UserService,
    private readonly multisignService: MultisignService
  ) {}

  @Post()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Save multisign action',
  })
  @ApiResponse({
    status: 201,
    description: 'Saved multisign action',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async saveAction(
    @Body() createActionDto: CreateActionDto,
    @UserAuth() userAuth: IUserAuth
  ) {
    if (!userAuth.config.isAdmin) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const user = await this.userService.findUserByAddress(userAuth.address);

    if (!user) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exits`
      );
    }

    const isSaved = await this.multisignService.addAction(createActionDto);

    if (!isSaved) {
      throw new BadRequestException(
        'Failed to save multisign action, cannot add more than one remove resource account action'
      );
    }
  }

  @Put()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Save reviewer signature',
  })
  @ApiResponse({
    status: 201,
    description: 'Saved reviewer signature',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async saveSignature(
    @Body() updateMultisignDto: UpdateActionDto,
    @UserAuth() userAuth: IUserAuth
  ) {
    if (!userAuth.config.isReviewer) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const user = await this.userService.findUserByAddress(userAuth.address);

    if (!user) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exits`
      );
    }

    const isUpdated = await this.multisignService.updateAction(
      updateMultisignDto
    );

    if (!isUpdated) {
      throw new NotFoundException('Failed to update multisign');
    }
  }

  @Get()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Get multisign actions',
  })
  @ApiResponse({
    status: 200,
    description: 'Multisign actions',
    type: [GetActionDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Not found user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async GetMultisignActions(@UserAuth() userAuth: IUserAuth) {
    if (!userAuth.config.isReviewer && !userAuth.config.isAdmin) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const user = await this.userService.findUserByAddress(userAuth.address);

    if (!user) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exits`
      );
    }

    const actions = await this.multisignService.findActions();

    return actions.map((action) => GetActionDto.fromJson(action));
  }

  @Delete(':action/:targetAddress')
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Delete multisign action',
  })
  @ApiResponse({
    status: 200,
    description: 'Multisign action deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async deleteAction(
    @Param('action') action: MultisignAction,
    @Param('targetAddress') targetAddress: string,
    @UserAuth() userAuth: IUserAuth
  ) {
    if (!userAuth.config.isReviewer && !userAuth.config.isAdmin) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const user = await this.userService.findUserByAddress(userAuth.address);

    if (!user) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exits`
      );
    }

    await this.multisignService.deleteAction({ targetAddress, action });
  }
}
