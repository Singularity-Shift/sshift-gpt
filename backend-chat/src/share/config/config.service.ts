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
  server: Joi.object({
    port: Joi.number().default(3100),
  }).default({
    port: 3100,
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
    type: Joi.string().default('local'),
    project_id: Joi.string().required(),
    private_key_id: Joi.string().required(),
    private_key: Joi.string().required(),
    client_email: Joi.string().required(),
    client_id: Joi.string().required(),
    universe_domain: Joi.string().required(),
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
});

type DotenvSchemaKeys =
  | 'nodeEnv'
  | 'server.port'
  | 'redis.pwd'
  | 'redis.port'
  | 'redis.host'
  | 'mongo.uri'
  | 'jwt.secret'
  | 'jwt.expiredTime'
  | 'openApi.apiKey'
  | 'storage.type'
  | 'storage.project_id'
  | 'storage.private_key_id'
  | 'storage.private_key'
  | 'storage.client_email'
  | 'storage.client_id'
  | 'storage.universe_domain'
  | 'eleven.url'
  | 'eleven.apiKey'
  | 'indexer.url'
  | 'indexer.apiKey'
  | 'indexer.userId'
  | 'cmc.baseUrl'
  | 'cmc.apiKey'
  | 'wiki.url';

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
