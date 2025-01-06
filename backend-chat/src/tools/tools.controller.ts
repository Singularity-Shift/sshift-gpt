import {
  Body,
  Controller,
  Get,
  HttpException,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { CreateSoundEffectDto } from './dto/create-sound-efect.dto';
import { IUserAuth } from '@helpers';
import { UserAuth } from '../auth/auth.decorator';
import { GenerateImageDto } from './dto/generate-image.dto';
import { GetImageDto } from './dto/get-image.dto';
import { GetSoundEffect } from './dto/get-sound-effect.dto';
import { GetUserNftsCollectionsDto } from './dto/get-user-nfts-collections.dto';
import { GetCryptoInfoFromCMCDto } from './dto/get-crypto-info-from-cmc.dto';
import { StockInfoDto } from './dto/stockInfo.dto';

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
    status: 201,
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
    status: 201,
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
    status: 201,
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

  @Get('get-crypto-info-from-cmd/:tokenSymbol')
  @ApiParam({
    name: 'tokenSymbol',
    description: 'Token symbol to get the info',
    type: String,
    required: true,
  })
  @ApiOperation({ summary: 'Get crypto info from Coinmarketcap' })
  @ApiResponse({
    description: 'Crypto info',
    type: GetCryptoInfoFromCMCDto,
    status: 200,
  })
  async getCryptoInfoFromCMC(
    @Param('tokenSymbol') tokenSymbol: string
  ): Promise<GetCryptoInfoFromCMCDto> {
    try {
      const cryptoInfo = await this.toolsService.findCryptoInfoFromCMC(
        tokenSymbol
      );

      return cryptoInfo;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error('Error fetching crypto info:', error);
        throw new HttpException('Internal server error', error.status);
      }
    }
  }

  @Post('get-stock-info')
  @ApiOperation({ summary: 'Get stock info' })
  @ApiResponse({
    description: 'Stock info',
    status: 201,
  })
  async getStockInfo(@Body() stockInfoDto: StockInfoDto) {
    try {
      const stockInfo = await this.toolsService.getStockInfo(stockInfoDto);

      return stockInfo;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error('Error fetching stock info:', error);
        throw new HttpException('Internal server error', error.status);
      }
    }
  }
}
