import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findUserByAddress(address: string): Promise<User> {
    return this.userModel.findOne({ address });
  }

  async addUser(address: string): Promise<User> {
    const user = await new this.userModel({
      address,
    });

    return user.save();
  }
}
