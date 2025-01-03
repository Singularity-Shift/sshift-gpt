import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AdminConfigService } from '../admin-config/admin-config.service';
import { ISubscriptionPlan } from '@helpers';

@Injectable()
export class AiService {
  constructor(
    private userService: UserService,
    private adminConfigService: AdminConfigService
  ) {}

  async checkModelCredits(subscriptionPlan: ISubscriptionPlan, model: string) {
    const adminConfig = await this.adminConfigService.findAdminConfig();

    const modelCredits = subscriptionPlan.modelsUsed.find(
      (u) => u.name === model
    );

    const modelConfig = adminConfig.models.find((m) => m.name === model);

    if (!modelConfig) {
      return true;
    }

    const duration = Math.floor(
      (subscriptionPlan.endDate - subscriptionPlan.startDate) / (60 * 60 * 24)
    );

    if (
      modelCredits?.creditsUsed &&
      modelCredits.creditsUsed >= modelConfig.credits * duration
    ) {
      return false;
    }
  }
}
