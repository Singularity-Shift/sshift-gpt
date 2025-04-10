import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nest-modules';

@Injectable()
export class AgentService {
  private logger = new Logger(AgentService.name);

  constructor(
    private httpService: HttpService,
    private readonly configService: ConfigService
  ) {}
  async generateImage(
    prompt,
    aspect_ratio,
    model,
    magic_prompt_option,
    style_type,
    auth,
    signal
  ) {
    try {
      this.logger.log('Generating image with params:', {
        prompt,
        aspect_ratio,
        model,
        magic_prompt_option,
        style_type,
      });

      const result = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get('serverToolsApi.uri')}/ideogram/generate`,
          {
            prompt,
            aspect_ratio,
            model,
            magic_prompt_option,
            style_type,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 120000,
            signal,
          }
        )
      );

      if (!result.data.url) {
        return {
          error: true,
          message: 'No image URL returned from generation',
        };
      }

      return {
        url: result.data.url,
        prompt,
      };
    } catch (error) {
      this.logger.error(
        'Error in generateImage:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          `Failed to generate image: ${error.message}`,
      };
    }
  }

  async searchWeb(query, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get('serverToolsApi.uri')}/tools/search-web`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: { query },
            timeout: 60000,
            signal,
          }
        )
      );

      const data = response.data;
      if (
        data &&
        data.result &&
        Array.isArray(data.citations) &&
        data.citations.length > 0
      ) {
        data.result = data.result.replace(/\[(\d+)\]/g, (match, p1) => {
          const index = parseInt(p1, 10);
          if (index >= 1 && index <= data.citations.length) {
            return `[${index}](${data.citations[index - 1]})`;
          }
          return match;
        });
      }
      return data;
    } catch (error) {
      this.logger.error(
        'Error in searchWeb:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          `Failed to search web: ${error.message}`,
      };
    }
  }

  async wikiSearch(action, searchString, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get('serverToolsApi.uri')}/tools/wiki-search`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: { action, searchString },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error in wikiSearch:', error.response?.data?.message);
      return {
        error: true,
        message:
          error.response?.data?.message ||
          `Failed to search Wikipedia: ${error.message}`,
      };
    }
  }

  async getStockInfo(tickers, info_types, auth, signal) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/get-stock-info`,
          {
            tickers,
            info_types,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return result.data;
    } catch (error) {
      this.logger.error(
        'Error in getStockInfo:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          `Failed to get stock info: ${error.message}`,
      };
    }
  }

  async getCryptoInfoFromCMC(token_symbol, auth, signal) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/get-crypto-info-from-cmd/${token_symbol}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return result.data;
    } catch (error) {
      return {
        error: true,
        message:
          error.response?.data?.message ||
          `Failed to get crypto info from CoinMarketCap: ${error.message}`,
      };
    }
  }

  async queryArxiv(
    search_query,
    max_results,
    sort_by,
    sort_order,
    auth,
    signal
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get('serverToolsApi.uri')}/tools/search-arxiv`,
          { search_query, max_results, sort_by, sort_order },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error in queryArxiv:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          `Failed to query arXiv: ${error.message}`,
      };
    }
  }

  async getTrendingCryptos(option, limit = 10, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/get-trending-cryptos/${option}`,
          {
            params: { limit },
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error in getTrendingCryptos:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          `Failed to get trending cryptos: ${error.message}`,
      };
    }
  }

  async searchNftCollection(collection_name, chain, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/search-nft-collection/${collection_name}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: { chain },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        return {
          error: true,
          message: 'Request was cancelled or timed out',
        };
      }
      this.logger.error(
        'Error in searchNftCollection:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          `Failed to search NFT collection: ${error.message}`,
      };
    }
  }

  async searchTrendingNFT({ period, trending_by, limit, chain }, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/search-trending-nft`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: {
              period,
              trending_by,
              limit,
              chain,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        return {
          error: true,
          message: 'Request was cancelled or timed out',
        };
      }
      this.logger.error(
        'Error in searchTrendingNFT:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          `Failed to search trending NFTs: ${error.message}`,
      };
    }
  }

  async createSoundEffect(
    text,
    duration_seconds,
    prompt_influence,
    auth,
    signal
  ) {
    try {
      this.logger.log('Creating sound effect with params:', {
        text,
        duration_seconds,
        prompt_influence,
      });

      const result = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/create-sound-effect`,
          {
            text,
            duration_seconds,
            prompt_influence,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 120000,
            signal,
          }
        )
      );

      if (!result.data.url) {
        return {
          error: true,
          message: 'No sound effect URL returned from generation',
        };
      }

      return {
        content: `[Sound Effect: ${text}](${result.data.url})`,
        duration_seconds,
        text,
      };
    } catch (error) {
      this.logger.error(
        'Error in createSoundEffect:',
        error.response?.data?.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          `Failed to create sound effect: ${error.message}`,
      };
    }
  }

  async fetchUserNFTCollections(auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/fetch-user-nft-collections`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error in fetchUserNFTCollections:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          `Failed to fetch user NFT collections: ${error.message}`,
      };
    }
  }

  async getAllTopics(date, protocol, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/handle-finder/topics`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: { date, protocol },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error in getAllTopics:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message || 'Failed to fetch all topics in lens',
      };
    }
  }

  async getTokenStats(limit, page, protocol, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/handle-finder/tokens/stats`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: { limit, page, protocol },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error in getTokensMentioned:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          'Failed to fetch tokens mentioned in lens',
      };
    }
  }

  async getTrendingUsers(page, limit, ratio, protocol, auth, signal) {
    const query = { page, limit, ratio, protocol };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/handle-finder/trending/users`,
          query,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error in getTrendingUsers:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message || 'Failed to fetch trending users',
      };
    }
  }

  async getMentionsTwitter(limit, offset, auth, signal) {
    const query = { limit, offset };

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get('serverToolsApi.uri')}/elfa/mentions`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: query,
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error in getMentions:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message: error.response?.data?.message || 'Failed to fetch mentions',
      };
    }
  }

  async getOnchainActions(prompt, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get('serverToolsApi.uri')}/onchain-agent`,
          { prompt },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error in getOnchainActions:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message || 'Failed to fetch onchain actions',
      };
    }
  }

  async getTopMentionsTwitter(
    ticker,
    timeWindow,
    page,
    pageSize,
    includeAccountDetails,
    auth,
    signal
  ) {
    const query = {
      ticker,
      timeWindow,
      page,
      pageSize,
      includeAccountDetails,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get('serverToolsApi.uri')}/elfa/top-mentions`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: query,
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data.data.data.map((e) => {
        const values = { ...e };

        values.twitter_url = `https://twitter.com/${e.twitter_account_info.username}/status/${e.twitter_id}`;
        return values;
      });
    } catch (error) {
      console.error(
        'Error in getTopMentions:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          'Failed to fetch top mentions in twitter',
      };
    }
  }

  async getTrendingTokensTwitter(
    timeWindow,
    page,
    pageSize,
    minMentions,
    auth,
    signal
  ) {
    const query = {
      timeWindow,
      page,
      pageSize,
      minMentions,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/elfa/trending-tokens`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: query,
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error in getTrendingTokens:',
        error.response?.data?.message || error.message
      );
      return {
        error: true,
        message:
          error.response?.data?.message ||
          'Failed to fetch trending tokens in twitter',
      };
    }
  }
}
