import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AIModel, FeatureType, IUserAuth, UserType } from '@helpers';
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

      if (user.config.isCollector) {
        return true;
      }

      const createMessageDto: CreateMessageDto = context
        .switchToHttp()
        .getRequest()?.body;

      if (createMessageDto?.model) {
        model = createMessageDto.model;
      }

      if (
        user.config.userType === UserType.Free &&
        model !== AIModel.GPT4oMini
      ) {
        throw new UnauthorizedException('Free users can only use GPT4oMini');
      }

      const userConfig = await this.userService.findUserByAddress(user.address);
      const adminConfig = await this.adminConfigService.findAdminConfig(
        user.config.userType
      );

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
