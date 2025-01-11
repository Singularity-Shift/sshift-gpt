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
    private adminConfigModel: Model<AdminConfigDocument>,
  ) {}

  async findAdminConfig(): Promise<AdminConfig> {
    const adminConfig = await this.adminConfigModel.findOne().exec();
    if (!adminConfig) {
      // Create default config if none exists
      const defaultConfig = new this.adminConfigModel({
        models: [],
        tools: [],
        systemPrompt: defaultPrompt.content
      });
      return defaultConfig.save();
    }
    return adminConfig;
  }

  async updateAdmin(adminConfigDto: AdminConfigDto): Promise<AdminConfig> {
    const adminConfig = await this.adminConfigModel.findOne().exec();
    if (!adminConfig) {
      const newAdminConfig = new this.adminConfigModel({
        ...adminConfigDto,
        systemPrompt: adminConfigDto.systemPrompt || defaultPrompt.content
      });
      return newAdminConfig.save();
    }
    
    adminConfig.models = adminConfigDto.models;
    adminConfig.tools = adminConfigDto.tools;
    adminConfig.systemPrompt = adminConfigDto.systemPrompt || defaultPrompt.content;
    
    return adminConfig.save();
  }
}
