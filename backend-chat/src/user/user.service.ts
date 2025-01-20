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

  async getUserChatsWithPagination(address: string, page = 1, limit = 10) {
    // Ensure page is at least 1
    page = Math.max(1, page);
    // Ensure limit is between 1 and 100
    limit = Math.min(Math.max(1, limit), 100);

    const user = await this.userModel.findOne(
      { address },
      {
        chats: { $slice: [(page - 1) * limit, limit] },
        address: 1,
      }
    ).sort({ "chats.timestamp": -1 });

    if (!user) {
      return null;
    }

    // Get total count in a separate query
    const totalCount = await this.userModel
      .aggregate([
        { $match: { address } },
        { $project: { count: { $size: '$chats' } } },
      ])
      .then((result) => result[0]?.count || 0);

    return {
      chats: user.chats || [],
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
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
    // First get the current user to compare message counts
    const currentUser = await this.userModel.findOne({
      address: address.toLowerCase(),
    });
    const currentChats = currentUser?.chats || [];

    return this.userModel.updateOne(
      {
        _id: currentUser._id,
        address: address.toLowerCase(),
      },
      {
        chats: [
          ...chats.map((newChat) => {
            const existingChat = currentChats.find((c) => c.id === newChat.id);
            const hasNewMessages = existingChat
              ? newChat.messages.length > existingChat.messages.length
              : true;

            return {
              ...newChat,
              lastUpdated: hasNewMessages
                ? Date.now()
                : newChat.lastUpdated || Date.now(),
            };
          }),
        ],
      }
    );
  }

  async getChatMessagesWithPagination(address: string, chatId: string, page = 1, limit = 50) {
    // Ensure page is at least 1
    page = Math.max(1, page);
    // Ensure limit is between 1 and 100
    limit = Math.min(Math.max(1, limit), 100);

    const user = await this.userModel.findOne(
      { 
        address,
        'chats.id': chatId 
      },
      {
        'chats.$': 1
      }
    );

    if (!user || !user.chats || user.chats.length === 0) {
      return null;
    }

    const chat = user.chats[0];
    const totalMessages = chat.messages.length;
    
    // Calculate start and end indices for pagination
    const startIdx = Math.max(0, totalMessages - (page * limit));
    const endIdx = Math.max(0, totalMessages - ((page - 1) * limit));
    
    // Get the paginated messages in reverse order (newest first)
    const paginatedMessages = chat.messages.slice(startIdx, endIdx).reverse();

    return {
      chatId: chat.id,
      messages: paginatedMessages,
      total: totalMessages,
      page,
      limit,
      totalPages: Math.ceil(totalMessages / limit),
    };
  }
}
