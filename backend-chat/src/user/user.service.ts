import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model, UpdateWriteOpResult } from 'mongoose';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async updateUser(
    address: string,
    updateUserDto: UpdateUserDto
  ): Promise<UpdateWriteOpResult> {
    const user = await this.userModel.updateOne(
      {
        address,
      },
      {
        ...updateUserDto,
      }
    );

    return user;
  }
}
