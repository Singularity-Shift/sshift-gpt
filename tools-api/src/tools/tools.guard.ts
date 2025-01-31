import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  mixin,
  UnauthorizedException,
} from '@nestjs/common';
import { FeatureType, IUserAuth } from '@helpers';
import { UserService, AdminConfigService } from '@nest-modules';

export const ToolsGuard = (tool: string) => {
  @Injectable()
  class ToolsGuardMixin implements CanActivate {
    constructor(
      public readonly adminConfigService: AdminConfigService,
      public readonly userService: UserService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      try {
        const user: IUserAuth = context.switchToHttp().getRequest()?.user;

        if (user.config.isCollector) {
          return true;
        }

        if (
          !user.config.subscriptionPlan?.active ||
          !user.config.subscriptionPlan?.startDate ||
          !user.config.subscriptionPlan?.endDate
        ) {
          throw new UnauthorizedException('User subscription is not active');
        }

        const userConfig = await this.userService.findUserByAddress(
          user.address
        );
        const adminConfig = await this.adminConfigService.findAdminConfig();

        const toolsCredits = userConfig.activity.tools.find(
          (u) => u.name === tool
        );

        const toolsConfig = adminConfig.tools.find((m) => m.name === tool);

        if (!toolsConfig) {
          return true;
        }

        const startDate = new Date(
          user.config.subscriptionPlan.startDate
        ).getTime();
        const endDate = user.config.subscriptionPlan.endDate;
        const duration = Math.floor((endDate - startDate) / (60 * 60 * 24));

        if (
          toolsCredits?.creditsUsed &&
          toolsCredits.creditsUsed >= toolsConfig.credits * duration
        ) {
          throw new UnauthorizedException(
            `Not enough credits for tool: ${tool}`
          );
        }

        await this.userService.updateFeatureActivity(user.address, {
          name: tool,
          creditType: FeatureType.Tools,
          creditsUsed: toolsCredits?.creditsUsed || 0,
        });

        return true;
      } catch (error) {
        throw new HttpException(error.message, error.status || 500);
      }
    }
  }

  const guard = mixin(ToolsGuardMixin);

  return guard;
};
