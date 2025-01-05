import { Body, Controller, HttpException, Logger, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { CreateSoundEffectDto } from './dto/create-sound-efect.dto';
import { IUserAuth } from '@helpers';
import { UserAuth } from '../auth/auth.decorator';
import { GenerateImageDto } from './dto/generate-image.dto';
import { GetImageDto } from './dto/get-image.dto';
import { GetSoundEffect } from './dto/get-sound-effect.dto';
import { GetUserNftsCollectionsDto } from './dto/get-user-nfts-collections.dto';

@Controller('tools')
@ApiBearerAuth('Authorization')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal server error' })
export class ToolsController {
  logger = new Logger(ToolsController.name);

  constructor(private readonly toolsService: ToolsService) {}
  @Post('create-sound-effect')
  @ApiOperation({ summary: 'Generate AI response' })
  @ApiResponse({
    description: 'Generated sound effect',
    type: GetSoundEffect,
  })
  async createUserEffect(@Body() createSoundEffectDto: CreateSoundEffectDto) {
    try {
      const soundEffect = await this.toolsService.createSoundEffect(
        createSoundEffectDto
      );

      return GetSoundEffect.fromJson(soundEffect);
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
  @ApiResponse({
    description: 'User NFT collections',
    type: [GetUserNftsCollectionsDto],
  })
  async fetchUserNftCollections(
    @UserAuth() user: IUserAuth
  ): Promise<GetUserNftsCollectionsDto[]> {
    try {
      return this.toolsService.fetchWalletItemsCollections(user.address);
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
  @ApiResponse({
    description: 'Generated image',
    type: GetImageDto,
  })
  async createImage(@Body() generateImageDto: GenerateImageDto) {
    try {
      const imageGenerated = await this.toolsService.generateImage(
        generateImageDto
      );

      return GetImageDto.fromJson(imageGenerated);
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
