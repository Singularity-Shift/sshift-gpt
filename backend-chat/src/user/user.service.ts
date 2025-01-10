import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model, UpdateWriteOpResult } from 'mongoose';
import { ChatHistoryDto } from '../chat/dto/chat-history.dto';
import { Activity } from './activity/activity.schema';
import { FeatureActivityDto } from './dto/credits-used.dto';
import { FeatureActivity } from './activity/feature-used.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>
  ) {}

  async findUserByAddress(address: string): Promise<User> {
    const user = await this.userModel.findOne({ address });

    if (user?.activity) {
      user.activity = await this.activityModel.findOne({ _id: user.activity });
    }

    return user;
  }

  async addUser(address: string): Promise<User> {
    const activityModel = await new this.activityModel({
      models: [],
      tools: [],
    });

    const activity = await activityModel.save();

    const user = await new this.userModel({
      address,
    });

    user.activity = activity;

    return user.save();
  }

  async updateFeatureActivity(
    address: string,
    creditsUsed: FeatureActivityDto
  ): Promise<FeatureActivityDto> {
    const user = await this.userModel.findOne({ address });

    const userActivity = await this.activityModel.findOne({
      _id: user.activity,
    });

    let creditType: FeatureActivity = userActivity[
      creditsUsed.creditType.toLocaleLowerCase()
    ]?.find((r) => r.name === creditsUsed.name);

    if (creditType) {
      userActivity[creditsUsed.creditType.toLocaleLowerCase()] = [
        ...userActivity[creditsUsed.creditType.toLocaleLowerCase()].map((a) => {
          if (a.name === creditsUsed.name) {
            return { ...a, creditsUsed: a.creditsUsed + 1 };
          }
          return a;
        }),
      ];
    } else {
      creditType = {
        name: creditsUsed.name,
        creditsUsed: 1,
      };

      userActivity[creditsUsed.creditType.toLocaleLowerCase()] = [
        ...userActivity[creditsUsed.creditType.toLocaleLowerCase()],
        creditType,
      ];
    }

    await this.activityModel.updateOne(
      {
        _id: userActivity._id,
      },
      userActivity
    );

    creditsUsed.creditsUsed = creditType.creditsUsed;

    return creditsUsed;
  }

  async updateUser(
    address: string,
    chats: ChatHistoryDto[]
  ): Promise<UpdateWriteOpResult> {
    return this.userModel.updateOne(
      { address: address.toLowerCase() },
      { chats: [...chats.map((c) => ({ ...c, lastUpdated: Date.now() }))] }
    );
  }
}
