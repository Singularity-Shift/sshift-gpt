import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FeatureType, IUserAuth } from '@helpers';
import { UserService, AdminConfigService } from '@nest-modules';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class AgentGuard implements CanActivate {
  constructor(
    public readonly adminConfigService: AdminConfigService,
    public readonly userService: UserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      let model = '';

      const user: IUserAuth = context.switchToHttp().getRequest()?.user;

      const createMessageDto: CreateMessageDto = context
        .switchToHttp()
        .getRequest()?.body;

      if (createMessageDto?.model) {
        model = createMessageDto.model;
      }

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

      const userConfig = await this.userService.findUserByAddress(user.address);
      const adminConfig = await this.adminConfigService.findAdminConfig();

      const modelCredits = userConfig.activity.models.find(
        (m) => m.name === model
      );

      const modelConfig = adminConfig.models.find((m) => m.name === model);

      if (!modelConfig) {
        return true;
      }

      const startDate = new Date(
        user.config.subscriptionPlan.startDate
      ).getTime();
      const endDate = user.config.subscriptionPlan.endDate;
      const duration = Math.floor((endDate - startDate) / (60 * 60 * 24));

      if (
        modelCredits?.creditsUsed &&
        modelCredits.creditsUsed >= modelConfig.credits * duration
      ) {
        throw new UnauthorizedException(
          `Not enough credits for tool: ${model}`
        );
      }

      await this.userService.updateFeatureActivity(user.address, {
        name: model,
        creditType: FeatureType.Models,
        creditsUsed: modelCredits?.creditsUsed || 0,
      });

      return true;
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
