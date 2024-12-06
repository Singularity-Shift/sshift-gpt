import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AdminConfig } from './admin-config.schema';
import { Model } from 'mongoose';
import { AdminConfigDto } from './dto/adming-config.dto';

@Injectable()
export class AdminConfigService {
  constructor(
    @InjectModel(AdminConfig.name) private adminConfigModel: Model<AdminConfig>
  ) {}

  async findAdminConfig(): Promise<AdminConfig> {
    return this.adminConfigModel.findOne();
  }

  async updateAdmin(adminConfigDto: AdminConfigDto): Promise<AdminConfig> {
    let adminConfig: AdminConfig;
    const response = await this.adminConfigModel.findOne();

    if (response) {
      adminConfig = await this.adminConfigModel.findOneAndUpdate(
        {
          _id: response._id,
        },
        {
          ...adminConfigDto,
        }
      );
    } else {
      adminConfig = await this.adminConfigModel.create({
        ...adminConfigDto,
      });
    }

    return adminConfig;
  }
}
