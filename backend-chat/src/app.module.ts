import { Module } from '@nestjs/common';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { redisStore } from 'cache-manager-ioredis-yet';
import { RedisOptions } from 'ioredis';
import {
  ConfigModule,
  UserModule,
  ChatModule,
  AuthGuard,
  AuthModule,
  ConfigService,
  AdminConfigModule,
  BucketModule,
} from '@nest-modules';
import { MongooseModule } from '@nestjs/mongoose';
import { MultisignModule } from './multisign/multising.module';
import { AgentModule } from './agent/agent.module';
import { Injectable, ExecutionContext } from '@nestjs/common';

// Custom cache interceptor that excludes bucket download endpoints
@Injectable()
export class CustomCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { url } = request;
    
    // Skip caching for bucket download endpoints
    if (url.includes('/bucket/download/')) {
      return undefined;
    }
    
    // Use the default tracking for all other endpoints
    return super.trackBy(context);
  }
}

@Module({
  imports: [
    ConfigModule,
    ChatModule,
    CacheModule.registerAsync<RedisOptions>({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          store: redisStore,
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.pwd'),
        };
      },
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.get<string>('mongo.uri'),
        };
      },
    }),
    AuthModule,
    UserModule,
    AdminConfigModule,
    MultisignModule,
    AgentModule,
    BucketModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomCacheInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
