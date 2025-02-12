import {
  Body,
  Controller,
  Get,
  HttpException,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { CreateSoundEffectDto } from './dto/create-sound-efect.dto';
import { IUserAuth, TrendingOptions } from '@helpers';
import { UserAuth } from '@nest-modules';
import { GenerateImageDto } from './dto/generate-image.dto';
import { GetImageDto } from './dto/get-image.dto';
import { GetSoundEffect } from './dto/get-sound-effect.dto';
import { GetUserNftsCollectionsDto } from './dto/get-user-nfts-collections.dto';
import { GetCryptoInfoFromCMCDto } from './dto/get-crypto-info-from-cmc.dto';
import { StockInfoDto } from './dto/stockInfo.dto';
import { GetStockInfoDto } from './dto/get-stock-info.dto';
import { GetTrendingCryptoDto } from './dto/get-trending-crypto.dto';
import { GetNFTCollectionDto } from './dto/get-nft-collection.dto';
import { GetTrendingNFTDto } from './dto/get-trending-nft.dto';
import { GetSearchWebDto } from './dto/get-search-web.dto';
import { SearchArxivDto } from './dto/search-arxiv.dto';
import { ToolsGuard } from './tools.guard';

@Controller('tools')
@ApiBearerAuth('Authorization')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal server error' })
export class ToolsController {
  logger = new Logger(ToolsController.name);

  constructor(private readonly toolsService: ToolsService) {}
  @Post('create-sound-effect')
  @UseGuards(ToolsGuard('createSoundEffect'))
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
  @UseGuards(ToolsGuard('fetchUserNFTCollections'))
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
  @UseGuards(ToolsGuard('generateImage'))
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
  @UseGuards(ToolsGuard('getCryptoInfoFromCMC'))
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
  @UseGuards(ToolsGuard('getStockInfo'))
  @ApiOperation({ summary: 'Get stock info' })
  @ApiResponse({
    description: 'Stock info',
    status: 201,
    type: [GetStockInfoDto],
  })
  async getStockInfo(
    @Body() stockInfoDto: StockInfoDto
  ): Promise<GetStockInfoDto[]> {
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

  @Get('get-trending-cryptos/:option')
  @UseGuards(ToolsGuard('getTrendingCryptos'))
  @ApiParam({
    name: 'option',
    description: 'Option to get trending cryptos',
    type: String,
    required: true,
    example: TrendingOptions.popularity,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Limit the number of results',
    example: 10,
  })
  @ApiOperation({ summary: 'Get trending cryptos' })
  @ApiResponse({
    description: 'Trending cryptos',
    type: [GetTrendingCryptoDto],
    status: 200,
  })
  getTrendingCryptos(
    @Param('option') option: TrendingOptions,
    @Query('limit') limit = 10
  ): Promise<GetTrendingCryptoDto[]> {
    try {
      const trendingCryptos = this.toolsService.getTrendingCryptos(
        option,
        limit
      );

      return trendingCryptos;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error('Error fetching trending cryptos:', error);
        throw new HttpException('Internal server error', error.status);
      }
    }
  }

  @Get('search-nft-collection/:collectionName')
  @UseGuards(ToolsGuard('searchNftCollection'))
  @ApiParam({
    name: 'collectionName',
    description: 'Collection name to search',
    type: String,
    required: true,
    example: 'Qribbles',
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain to search on (aptos, sui, or movement)',
    type: String,
    required: true,
    example: 'aptos',
  })
  @ApiOperation({ summary: 'Search NFT collection' })
  @ApiResponse({
    description: 'NFT collection items',
    status: 200,
    type: GetNFTCollectionDto,
  })
  searchNFTCollection(
    @Param('collectionName') collectionName: string,
    @Query('chain') chain: string = 'aptos'
  ): Promise<GetNFTCollectionDto> {
    try {
      return this.toolsService.searchNFTCollection(collectionName, chain);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error('Error searching NFT collection:', error);
        throw new HttpException('Internal server error', error.status);
      }
    }
  }

  @Get('search-trending-nft')
  @UseGuards(ToolsGuard('searchTrendingNFT'))
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Limit the number of results',
    example: 10,
  })
  @ApiQuery({
    name: 'period',
    type: String,
    required: true,
    description: 'Period to filter results',
    example: 'days_7',
  })
  @ApiQuery({
    name: 'trending_by',
    type: String,
    required: true,
    description: 'Trending by (crypto_volume, usd_volume, trades_count, average_trade)',
    example: 'crypto_volume',
  })
  @ApiQuery({
    name: 'chain',
    type: String,
    required: true,
    description: 'Blockchain to search on (aptos, sui, or movement)',
    example: 'aptos',
  })
  @ApiOperation({ summary: 'Search trending NFTs' })
  @ApiResponse({
    description: 'Trending NFTs',
    status: 200,
    type: [GetTrendingNFTDto],
  })
  searchTrendingNFTs(
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('period') period: string,
    @Query('trending_by') trendingBy: string,
    @Query('chain') chain: string = 'aptos'
  ): Promise<GetTrendingNFTDto> {
    try {
      return this.toolsService.searchTrendingNFT({ period, trendingBy, limit, chain });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error('Error searching trending NFTs:', error);
        throw new HttpException('Internal server error', error.status);
      }
    }
  }

  @Get('wiki-search')
  @UseGuards(ToolsGuard('wikiSearch'))
  @ApiQuery({
    name: 'action',
    type: String,
    required: true,
    description: 'Action to perform on Wikipedia',
    example: 'opensearch',
  })
  @ApiQuery({
    name: 'searchQuery',
    type: String,
    required: true,
    description: 'Search query',
    example: 'Artificial intelligence',
  })
  @ApiOperation({ summary: 'Search Wikipedia' })
  @ApiResponse({
    description: 'Wikipedia search results',
    status: 200,
    type: String,
  })
  searchWiki(
    @Query('action') action: string,
    @Query('searchString') searchString: string
  ): Promise<string> {
    try {
      return this.toolsService.searchWiki(action, searchString);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error('Error searching Wikipedia:', error);
        throw new HttpException('Internal server error', error.status);
      }
    }
  }

  @Get('search-web')
  @UseGuards(ToolsGuard('searchWeb'))
  @ApiQuery({
    name: 'query',
    type: String,
    required: true,
    description: 'Search query',
    example: 'Artificial intelligence',
  })
  @ApiOperation({ summary: 'Search web' })
  @ApiResponse({
    description: 'Web search results',
    status: 200,
    type: GetSearchWebDto,
  })
  searchWeb(@Query('query') query: string): Promise<GetSearchWebDto> {
    try {
      return this.toolsService.searchWeb(query);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error('Error searching web:', error);
        throw new HttpException('Internal server error', error.status);
      }
    }
  }

  @Post('search-arxiv')
  @UseGuards(ToolsGuard('queryArxiv'))
  @ApiOperation({ summary: 'Search ArXiv' })
  @ApiResponse({
    description: 'ArXiv search results',
    status: 200,
    type: String,
  })
  searchArXiv(@Body() searchArXivDto: SearchArxivDto): Promise<string> {
    try {
      return this.toolsService.queryArxiv(searchArXivDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error('Error searching ArXiv:', error);
        throw new HttpException('Internal server error', error.status);
      }
    }
  }
}
