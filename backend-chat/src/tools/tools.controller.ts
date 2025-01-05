import {
  Body,
  Controller,
  HttpException,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { Response } from 'express';
import { CreateSoundEffectDto } from './dto/create-sound-efect.dto';
import { IUserAuth } from '@helpers';
import { UserAuth } from '../auth/auth.decorator';
import { GenerateImageDto } from './dto/generate-image.dto';

@Controller('tools')
@ApiBearerAuth('Authorization')
export class ToolsController {
  logger = new Logger(ToolsController.name);

  constructor(private readonly toolsService: ToolsService) {}
  @Post('create-sound-effect')
  @ApiOperation({ summary: 'Generate AI response' })
  async createUserEffect(
    @Body() createSoundEffectDto: CreateSoundEffectDto,
    @Res() res: Response
  ) {
    try {
      await this.toolsService.createSoundEffect(createSoundEffectDto, res);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error('Error creating sound effect:', error);
        throw new HttpException('Internal server error', error.status);
      }
    }
  }

  @Post('fetch-user-nft-collections')
  @ApiOperation({ summary: 'Fetch user NFT collections' })
  async fetchUserNftCollections(@UserAuth() user: IUserAuth) {
    try {
      await this.toolsService.fetchWalletItemsCollections(user.address);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error('Error fetching user NFT collections:', error);
        throw new HttpException('Internal server error', error.status);
      }
    }
  }

  @Post('generate-image')
  @ApiOperation({ summary: 'Generame image by chat gpt' })
  async createImage(
    @Body() generateImageDto: GenerateImageDto,
    @Res() res: Response
  ) {
    try {
      await this.toolsService.generateImage(generateImageDto, res);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error('Error generating image:', error);
        throw new HttpException('Internal server error', error.status);
      }
    }
  }
}
