import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { Activity } from './activity/activity.schema';
import { FeatureActivityDto } from './dto/credits-used.dto';
import { FeatureActivity } from './activity/feature-used.schema';
import { Chat } from '../chat/chat.schema';
import { NewMessageDto } from '../chat/dto/new-message.dto';
import { ChatHistoryDto } from '../chat/dto/chat-history.dto';

@Injectable()
export class UserService {
  private logger = new Logger('UserService');

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

    const user = await this.userModel
      .findOne(
        { address },
        {
          chats: { $slice: [(page - 1) * limit, limit] },
          address: 1,
        }
      )
      .sort({ 'chats.timestamp': -1 });

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

  async addChat(address: string, chat: ChatHistoryDto): Promise<Chat> {
    const user = await this.userModel.findOneAndUpdate(
      {
        address: address.toLowerCase(),
      },
      {
        $push: { chats: chat },
      },
      {
        new: true,
      }
    );

    return user?.chats.find((c) => c.id === chat.id) as Chat;
  }

  async updateChat(address: string, chat: NewMessageDto): Promise<Chat> {
    const { message, id } = chat;

    this.logger.log(`Updating chat ${id} for user ${address}`);

    const currentUser = await this.userModel.findOne({
      $and: [
        { address: address.toLowerCase() },
        { chats: { $elemMatch: { id } } },
      ],
    });

    if (!currentUser) {
      throw new Error(`User with address ${address} not found`);
    }

    const chatIndex = currentUser.chats.findIndex((c) => c.id === id);

    if (chatIndex === -1) {
      const newChat: Chat = {
        id,
        title: chat.title,
        model: chat.model,
        messages: [
          {
            ...message,
            createdAt: new Date(),
            timestamp: Date.now(),
          },
        ],
        createdAt: chat.createdAt,
        lastUpdated: chat.lastUpdated,
      };

      const user = (await this.userModel.findOneAndUpdate(
        {
          address: address.toLowerCase(),
        },
        {
          $push: { chats: newChat },
        }
      )) as User;

      return user.chats[chatIndex];
    }

    const messageIndex = currentUser.chats[chatIndex].messages.findIndex(
      (m) => m.id === message.id
    );

    if (messageIndex === -1) {
      const user = (await this.userModel.findOneAndUpdate(
        {
          $and: [
            { address: address.toLowerCase() },
            { chats: { $elemMatch: { id } } },
          ],
        },
        {
          $push: {
            'chats.$[chat].messages': message,
          },
          $set: {
            'chats.$[chat].lastUpdated': new Date(),
            'chats.$[chat].model': chat.model,
          },
        },
        {
          arrayFilters: [{ 'chat.id': id }],
          new: true,
        }
      )) as User;

      return user.chats[chatIndex];
    }

    const createdAt = new Date();

    await this.userModel.updateOne(
      {
        $and: [
          { address: address.toLowerCase() },
          { chats: { $elemMatch: { id } } },
        ],
      },
      {
        $pull: {
          'chats.$[chat].messages': { timestamp: { $gte: message.timestamp } },
        },
      },
      {
        arrayFilters: [{ 'chat.id': id }],
      }
    );

    const user = (await this.userModel.findOneAndUpdate(
      {
        $and: [
          { address: address.toLowerCase() },
          { chats: { $elemMatch: { id } } },
        ],
      },
      {
        $push: {
          'chats.$[chat].messages': { ...message, createdAt },
        },
        $set: {
          'chats.$[chat].lastUpdated': new Date(),
          'chats.$[chat].model': chat.model,
        },
      },
      {
        arrayFilters: [{ 'chat.id': id }],
        new: true,
      }
    )) as User;

    return user.chats[chatIndex];
  }

  async getChatMessagesWithPagination(
    address: string,
    chatId: string,
    page = 1,
    limit = 50
  ) {
    console.log(
      `[Pagination] Request params - address: ${address}, chatId: ${chatId}, page: ${page}, limit: ${limit}`
    );

    // Ensure page is at least 1
    page = Math.max(1, page);
    // Ensure limit is between 1 and 100
    limit = Math.min(Math.max(1, limit), 100);

    console.log(
      `[Pagination] Normalized params - page: ${page}, limit: ${limit}`
    );

    const user = await this.userModel.findOne(
      {
        address,
        'chats.id': chatId,
      },
      {
        'chats.$': 1,
      }
    );

    if (!user || !user.chats || user.chats.length === 0) {
      console.log(
        `[Pagination] No chat found for address: ${address} and chatId: ${chatId}`
      );
      return null;
    }

    const chat = user.chats[0];
    const totalMessages = chat.messages.length;
    console.log(`[Pagination] Total messages in chat: ${totalMessages}`);

    // If there are no messages, return empty result with metadata
    if (totalMessages === 0) {
      console.log('[Pagination] No messages in chat');
      return {
        chatId: chat.id,
        messages: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Calculate total pages first
    const totalPages = Math.ceil(totalMessages / limit);

    // Validate page number against total pages
    if (page > totalPages) {
      console.log(
        `[Pagination] Requested page ${page} exceeds total pages ${totalPages}`
      );
      return {
        chatId: chat.id,
        messages: [],
        total: totalMessages,
        page,
        limit,
        totalPages,
      };
    }

    // Calculate start and end indices for pagination
    let startIdx = Math.max(0, totalMessages - page * limit);
    let endIdx = Math.max(0, totalMessages - (page - 1) * limit);

    // Ensure indices are within bounds
    startIdx = Math.max(0, Math.min(startIdx, totalMessages));
    endIdx = Math.max(0, Math.min(endIdx, totalMessages));

    // Ensure startIdx is less than endIdx
    if (startIdx >= endIdx) {
      console.log('[Pagination] Start index >= End index, adjusting...');
      if (startIdx === endIdx && startIdx > 0) {
        startIdx = Math.max(0, startIdx - 1);
      }
    }

    console.log(
      `[Pagination] Calculated indices - startIdx: ${startIdx}, endIdx: ${endIdx}`
    );
    console.log(
      `[Pagination] Messages array bounds - 0 to ${totalMessages - 1}`
    );

    // Get the paginated messages in reverse order (newest first)
    const paginatedMessages = chat.messages.slice(startIdx, endIdx).reverse();
    console.log(`[Pagination] Retrieved ${paginatedMessages.length} messages`);

    const response = {
      chatId: chat.id,
      messages: paginatedMessages,
      total: totalMessages,
      page,
      limit,
      totalPages,
    };

    console.log(
      `[Pagination] Response metadata - total: ${response.total}, page: ${response.page}, totalPages: ${response.totalPages}`
    );
    return response;
  }

  async renameChat(
    address: string,
    chatId: string,
    newTitle: string
  ): Promise<Chat | undefined> {
    const user = await this.userModel.findOneAndUpdate(
      {
        $and: [
          { address: address.toLowerCase() },
          { chats: { $elemMatch: { id: chatId } } },
        ],
      },
      {
        $set: { 'chats.$[chat].title': newTitle },
      },
      { arrayFilters: [{ 'chat.id': chatId }] }
    );

    return user?.chats.find((c) => c.id === chatId);
  }

  async deleteChatById(address: string, chatId: string): Promise<Chat[]> {
    return (
      (await this.userModel.findOneAndUpdate(
        {
          address,
          'chats.id': chatId,
        },
        {
          $pull: { chats: { id: chatId } },
        },
        {
          new: true,
        }
      )) || []
    );
  }

  async deleteAllChatId(address: string): Promise<void> {
    await this.userModel.updateOne({ address }, { $set: { chats: [] } });
  }
}
