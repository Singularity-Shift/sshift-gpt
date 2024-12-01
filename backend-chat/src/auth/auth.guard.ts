import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '../share/config/config.service';
import { Request } from 'express';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { IUserConfig } from '@helpers';
import { abis, FeesABI, SubscriptionABI } from '@aptos';
import { UserService } from '../user/user.service';
import { AccountAddress } from '@aptos-labs/ts-sdk';

@Injectable()
export class AuthGuard implements CanActivate {
  logger = new Logger(AuthGuard.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
    private configService: ConfigService,
    private userService: UserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler()
    );
    if (isPublic) {
      return true;
    }

    try {
      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException();
      }

      const payload = jwt.verify(
        token,
        this.configService.get('jwt.secret')
      ) as jwt.JwtPayload;

      payload.config = await this.getUserConfig(payload.address);

      request['user'] = payload;

      return true;
    } catch (error) {
      this.logger.error(error);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async getUserConfig(address: `0x${string}`): Promise<IUserConfig> {
    let subscriptionDuration: number[];

    const userConfigCache = await this.cacheManager.get<IUserConfig>(
      `${address}_config`
    );

    if (userConfigCache) {
      return userConfigCache;
    }

    const currentAdminResult = await abis.useABI(FeesABI).view.get_admin({
      typeArguments: [],
      functionArguments: [],
    });

    const currentAdmin = currentAdminResult?.[0];

    const isAdmin =
      AccountAddress.fromString(currentAdmin) ===
      AccountAddress.fromString(address);

    const currentCollectorsResult = await abis
      .useABI(FeesABI)
      .view.get_collectors({
        typeArguments: [],
        functionArguments: [],
      });

    const isCollector = currentCollectorsResult?.[0].some(
      (c) => AccountAddress.fromString(c) === AccountAddress.fromString(address)
    );

    const hasSubscriptionResult = await abis
      .useABI(SubscriptionABI)
      .view.has_subscription_active({
        typeArguments: [],
        functionArguments: [address],
      });

    const hasSubscription = hasSubscriptionResult?.[0];

    if (hasSubscription) {
      const subscriptionPlanResult = await abis
        .useABI(SubscriptionABI)
        .view.get_plan({
          typeArguments: [],
          functionArguments: [address],
        });

      subscriptionDuration = subscriptionPlanResult?.map((s) => parseInt(s));
    }

    const user = await this.userService.findUserByAddress(address);

    const userConfig: IUserConfig = {
      subscriptionPlan: {
        active: hasSubscription,
        ...(hasSubscription
          ? {
              startDate: subscriptionDuration[0],
              endDate: subscriptionDuration[1],
              modelsUsed: user.activity.models,
              toolsUsed: user.activity.tools,
            }
          : undefined),
      },
      isAdmin,
      isCollector,
    };

    await this.cacheManager.set(`${address}_config`, userConfig);

    return userConfig;
  }
}
