import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AdminConfig } from './admin-config.schema';
import { Model, UpdateWriteOpResult } from 'mongoose';
import { AdminConfigDto } from './dto/adming-config.dto';

@Injectable()
export class AdminConfigService {
  constructor(
    @InjectModel(AdminConfig.name) private adminConfigModel: Model<AdminConfig>
  ) {}

  async findAdminConfig(): Promise<AdminConfig> {
    return this.adminConfigModel.findOne();
  }

  async updateAdmin(
    id: string,
    adminConfigDto: AdminConfigDto
  ): Promise<UpdateWriteOpResult> {
    const adminConfig = await this.adminConfigModel.updateOne(
      {
        _id: id,
      },
      {
        ...adminConfigDto,
      }
    );

    return adminConfig;
  }
}
