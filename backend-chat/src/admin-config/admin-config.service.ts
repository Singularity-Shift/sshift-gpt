import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminConfig, AdminConfigDocument } from './admin-config.schema';
import { AdminConfigDto } from './dto/adming-config.dto';

// Use require for JSON file since TypeScript needs special config for JSON imports
const defaultPrompt = require('./defaultPrompt.json');

@Injectable()
export class AdminConfigService {
  private cachedConfig: AdminConfig | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds

  constructor(
    @InjectModel(AdminConfig.name)
    private adminConfigModel: Model<AdminConfig>,
  ) {}

  async findAdminConfig(): Promise<AdminConfig> {
    // Check cache
    if (this.cachedConfig && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cachedConfig;
    }

    // First try to find existing config
    const existingConfig = await this.adminConfigModel.findOne({}).exec();
    
    if (existingConfig) {
      this.cachedConfig = existingConfig;
      this.cacheTimestamp = Date.now();
      return existingConfig;
    }
    
    // If no config exists, create new one with defaults
    const newConfig = await this.adminConfigModel.create({
      models: [],
      tools: [],
      systemPrompt: defaultPrompt.content
    });

    this.cachedConfig = newConfig;
    this.cacheTimestamp = Date.now();
    return newConfig;
  }

  async updateAdmin(adminConfigDto: AdminConfigDto): Promise<AdminConfig> {
    const updated = await this.adminConfigModel.findOneAndUpdate(
      {},
      {
        models: adminConfigDto.models,
        tools: adminConfigDto.tools,
        systemPrompt: adminConfigDto.systemPrompt || defaultPrompt.content
      },
      { upsert: true, new: true }
    ).exec();

    // Update cache after changes
    this.cachedConfig = updated;
    this.cacheTimestamp = Date.now();
    return updated;
  }
}
