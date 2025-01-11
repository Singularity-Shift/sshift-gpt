import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminConfig, AdminConfigDocument } from './admin-config.schema';
import { AdminConfigDto } from './dto/adming-config.dto';

// Use require for JSON file since TypeScript needs special config for JSON imports
const defaultPrompt = require('./defaultPrompt.json');

@Injectable()
export class AdminConfigService {
  constructor(
    @InjectModel(AdminConfig.name)
    private adminConfigModel: Model<AdminConfig>,
  ) {}

  async findAdminConfig(): Promise<AdminConfig> {
    return await this.adminConfigModel.findOneAndUpdate(
      {},
      {
        $setOnInsert: {
          models: [],
          tools: [],
          systemPrompt: defaultPrompt.content
        }
      },
      { upsert: true, new: true }
    ).exec();
  }

  async updateAdmin(adminConfigDto: AdminConfigDto): Promise<AdminConfig> {
    return await this.adminConfigModel.findOneAndUpdate(
      {},
      {
        models: adminConfigDto.models,
        tools: adminConfigDto.tools,
        systemPrompt: adminConfigDto.systemPrompt || defaultPrompt.content
      },
      { upsert: true, new: true }
    ).exec();
  }
}
