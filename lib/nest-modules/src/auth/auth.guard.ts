import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '../config/config.service';
import { Request } from 'express';
import {
  Chain,
  FeesABITypes,
  IUserConfig,
  SubscriptionABITypes,
  UserType,
} from '@helpers';
import {
  abis,
  FeesABI,
  SubscriptionABI,
  FeesMoveAbi,
  SubscriptionMoveABI,
} from '@aptos';
import { UserService } from '../user/user.service';
import { AccountAddress } from '@aptos-labs/ts-sdk';

@Injectable()
export class AuthGuard implements CanActivate {
  logger = new Logger(AuthGuard.name);
  constructor(
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
        this.configService.get<string>('jwt.secret')
      ) as jwt.JwtPayload;

      payload.config = await this.getUserConfig(payload.address, payload.chain);

      request['user'] = { auth: token, ...payload };

      return true;
    } catch (error) {
      this.logger.error(error);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async getUserConfig(
    address: `0x${string}`,
    chain: Chain
  ): Promise<IUserConfig> {
    let startTime: string;
    let endTime: string;
    let _upgrades: unknown[] | undefined;
    let _isTrialUser: boolean | undefined;

    const fullnode = (
      chain === Chain.Aptos
        ? process.env.NEXT_PUBLIC_APTOS_NODE_URL
        : process.env.NEXT_PUBLIC_MOVEMENT_NODE_URL
    ) as string;
    const indexer = (
      chain === Chain.Aptos
        ? process.env.NEXT_PUBLIC_APTOS_INDEXER
        : process.env.NEXT_PUBLIC_MOVEMENT_INDEXER
    ) as string;

    const feesABI: FeesABITypes = chain === Chain.Aptos ? FeesABI : FeesMoveAbi;
    const subscriptionABI: SubscriptionABITypes =
      chain === Chain.Aptos ? SubscriptionABI : SubscriptionMoveABI;

    const contract = abis(fullnode, indexer);

    const currentAdminResult = await contract.useABI(feesABI).view.get_admin({
      typeArguments: [],
      functionArguments: [],
    });

    const currentAdmin = currentAdminResult?.[0];

    const isAdmin =
      AccountAddress.from(currentAdmin).toString() ===
      AccountAddress.from(address).toString();

    const currentReviewerResult = await contract
      .useABI(feesABI)
      .view.get_reviewer({
        typeArguments: [],
        functionArguments: [],
      });

    const currentReviewer = currentReviewerResult?.[0];

    const isReviewer =
      AccountAddress.from(currentReviewer).toString() ===
      AccountAddress.from(address).toString();

    const currentCollectorsResult = await contract
      .useABI(feesABI)
      .view.get_collectors({
        typeArguments: [],
        functionArguments: [],
      });

    const isCollector = currentCollectorsResult?.[0].some(
      (c) =>
        AccountAddress.from(c).toString() ===
        AccountAddress.from(address).toString()
    );

    const hasSubscriptionResult = await contract
      .useABI(subscriptionABI)
      .view.has_subscription_active({
        typeArguments: [],
        functionArguments: [address],
      });

    const hasSubscription = hasSubscriptionResult?.[0];

    if (hasSubscription) {
      [startTime, endTime, _upgrades, _isTrialUser] = await contract
        .useABI(subscriptionABI)
        .view.get_plan({
          typeArguments: [],
          functionArguments: [AccountAddress.from(address).toString()],
        });
    }

    const user = await this.userService.findUserByAddress(
      AccountAddress.from(address).toString()
    );

    const userConfig: IUserConfig = {
      subscriptionPlan: {
        active: hasSubscription,
        ...(hasSubscription
          ? {
              startDate: parseInt(startTime),
              endDate: parseInt(endTime),
              modelsUsed: user.activity.models,
              toolsUsed: user.activity.tools,
            }
          : {
              modelsUsed: user.activity.models,
              toolsUsed: user.activity.tools,
            }),
      },
      isAdmin,
      isReviewer,
      isCollector,
      userType: hasSubscription ? UserType.Premium : UserType.Free,
    };

    return userConfig;
  }
}
