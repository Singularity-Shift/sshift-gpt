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

  async updateUser(
    address: string,
    chats: ChatHistoryDto[]
  ): Promise<UpdateWriteOpResult> {
    const currentUser = await this.userModel.findOne({
      address: address.toLowerCase(),
    });

    if (!currentUser) {
      throw new Error(`User with address ${address} not found`);
    }

    // Process each chat one at a time
    for (const newChat of chats) {
      // First, try to update existing chat if it exists
      const updateResult = await this.userModel.updateOne(
        {
          _id: currentUser._id,
          'chats.id': newChat.id,
        },
        {
          $set: {
            'chats.$.title': newChat.title,
            'chats.$.model': newChat.model,
            'chats.$.lastUpdated': Date.now(),
          },
        }
      );

      // If chat doesn't exist, add it as a new chat
      if (updateResult.matchedCount === 0) {
        await this.userModel.updateOne(
          { _id: currentUser._id },
          {
            $push: {
              chats: {
                ...newChat,
                lastUpdated: Date.now(),
              },
            },
          }
        );
      }

      // Now handle messages for this chat
      const existingChat = await this.userModel.findOne(
        {
          _id: currentUser._id,
          'chats.id': newChat.id,
        },
        { 'chats.$': 1 }
      );

      if (existingChat && existingChat.chats[0]) {
        const existingMessages = existingChat.chats[0].messages || [];
        const newMessages = newChat.messages || [];

        // Find messages that are in newMessages but not in existingMessages
        const messagesToAdd = newMessages.filter(
          (newMsg) =>
            !existingMessages.some(
              (existingMsg) => existingMsg.id === newMsg.id
            )
        );

        if (messagesToAdd.length > 0) {
          // Add only new messages to the chat
          await this.userModel.updateOne(
            {
              _id: currentUser._id,
              'chats.id': newChat.id,
            },
            {
              $push: {
                'chats.$.messages': {
                  $each: messagesToAdd,
                },
              },
            }
          );
        }
      }
    }

    return {
      acknowledged: true,
      modifiedCount: 1,
      matchedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    };
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
}
