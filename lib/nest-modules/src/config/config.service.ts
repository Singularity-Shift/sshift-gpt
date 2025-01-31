import { Logger } from '@nestjs/common';
import * as Joi from 'joi';
import { get as loGet } from 'lodash';
import { Profiles } from './profiles';

export interface EnvConfig {
  [key: string]: string;
}

const DOTENV_SCHEMA = Joi.object({
  nodeEnv: Joi.string()
    .valid('development', 'production')
    .default('development'),
  serverChatApi: Joi.object({
    port: Joi.number().default(3100),
  }).default({
    port: 3100,
  }),
  serverToolsApi: Joi.object({
    uri: Joi.string().required(),
    port: Joi.number().default(3400),
  }).default({
    port: 3400,
  }),
  redis: Joi.object({
    pwd: Joi.string().required(),
    port: Joi.number().default(6379),
    host: Joi.string().default('localhost'),
  }),
  mongo: Joi.object({
    uri: Joi.string().required(),
  }),
  jwt: Joi.object({
    secret: Joi.string().required(),
    expiredTime: Joi.string().default('31d'),
  }),
  openApi: Joi.object({
    apiKey: Joi.string().required(),
  }),
  storage: Joi.object({
    project_id: Joi.string().required(),
    storageCredentials: Joi.string().required(),
  }),
  eleven: Joi.object({
    url: Joi.string().required(),
    apiKey: Joi.string().required(),
  }),
  indexer: Joi.object({
    url: Joi.string().required(),
    apiKey: Joi.string().required(),
    userId: Joi.string().required(),
  }),
  cmc: Joi.object({
    baseUrl: Joi.string().required(),
    apiKey: Joi.string().required(),
  }),
  wiki: Joi.object({
    url: Joi.string().required(),
  }),
  perplexity: Joi.object({
    apiKey: Joi.string().required(),
    baseUrl: Joi.string().required(),
  }),
  arxiv: Joi.object({
    url: Joi.string().required(),
  }),
  handleFinder: Joi.object({
    apiKey: Joi.string().required(),
    baseUrl: Joi.string().required(),
    address: Joi.string().required(),
  }),
});

type DotenvSchemaKeys =
  | 'nodeEnv'
  | 'serverChatApi.port'
  | 'serverToolsApi.port'
  | 'serverToolsApi.uri'
  | 'redis.pwd'
  | 'redis.port'
  | 'redis.host'
  | 'mongo.uri'
  | 'jwt.secret'
  | 'jwt.expiredTime'
  | 'openApi.apiKey'
  | 'storage.project_id'
  | 'storage.storageCredentials'
  | 'eleven.url'
  | 'eleven.apiKey'
  | 'indexer.url'
  | 'indexer.apiKey'
  | 'indexer.userId'
  | 'cmc.baseUrl'
  | 'cmc.apiKey'
  | 'wiki.url'
  | 'perplexity.apiKey'
  | 'perplexity.baseUrl'
  | 'arxiv.url'
  | 'handleFinder.apiKey'
  | 'handleFinder.baseUrl'
  | 'handleFinder.address';

export class ConfigService {
  private readonly envConfig: EnvConfig;
  private readonly logger = new Logger(ConfigService.name);

  constructor() {
    this.envConfig = this.validateInput(
      Profiles[process.env.NODE_ENV || 'development']
    );
  }

  get<T>(path: DotenvSchemaKeys): T | undefined {
    return loGet(this.envConfig, path) as unknown as T | undefined;
  }

  private validateInput(envConfig: EnvConfig): EnvConfig {
    const { error, value: validatedEnvConfig } = DOTENV_SCHEMA.validate(
      envConfig,
      {
        allowUnknown: true,
        stripUnknown: true,
      }
    );
    if (error) {
      this.logger.error(
        'Missing configuration please provide followed variable!\n\n',
        'ConfigService'
      );
      this.logger.error(error.message, 'ConfigService');
      process.exit(2);
    }
    return validatedEnvConfig as EnvConfig;
  }
}
