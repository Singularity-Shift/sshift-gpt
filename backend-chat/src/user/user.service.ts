import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model, UpdateWriteOpResult } from 'mongoose';
import { ChatHistoryDto } from '../chat/dto/chat-history.dto';
import { Activity } from './activity/activity.schema';
import { ReqUsedDto } from './dto/req-used.dto';
import { ReqUsed } from './activity/req-used.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>
  ) {}

  async findUserByAddress(address: string): Promise<User> {
    const user = await this.userModel.findOne({ address });

    user.activity = await this.activityModel.findOne({ _id: user.activity });

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

  async updateReqUsed(
    address: string,
    reqUsed: ReqUsedDto
  ): Promise<ReqUsedDto> {
    const user = await this.userModel.findOne({ address });

    const userActivity = await this.activityModel.findOne({
      _id: user.activity,
    });

    let reqType: ReqUsed = userActivity[
      reqUsed.reqType.toLocaleLowerCase()
    ].find((r) => r.name === reqUsed.name);

    if (reqType) {
      reqType.reqUsed += 1;
    } else {
      reqType = {
        name: reqUsed.name,
        reqUsed: 1,
      };
    }

    userActivity[reqUsed.reqType.toLocaleLowerCase()] = [
      ...userActivity[reqUsed.reqType.toLocaleLowerCase()],
      reqType,
    ];

    await this.activityModel.updateOne(
      {
        _id: userActivity._id,
      },
      userActivity
    );

    reqUsed.reqUsed = reqType.reqUsed;

    return reqUsed;
  }

  async updateUser(
    address: string,
    updatechatsDto: ChatHistoryDto[]
  ): Promise<UpdateWriteOpResult> {
    const user = await this.userModel.updateOne(
      {
        address,
      },
      {
        chats: updatechatsDto,
      }
    );

    return user;
  }
}
