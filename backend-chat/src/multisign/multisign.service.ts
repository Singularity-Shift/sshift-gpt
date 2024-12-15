import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Multisign } from './multisign.schema';
import { MultisignAction } from '@helpers';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { DeleteActionDto } from './dto/delete-action.dto';

@Injectable()
export class MultisignService {
  constructor(
    @InjectModel(Multisign.name) private multisignModel: Model<Multisign>
  ) {}

  async findActions(): Promise<Multisign[]> {
    const actions = await this.multisignModel.find();

    return actions;
  }

  async addAction(actionDto: CreateActionDto): Promise<boolean> {
    if (actionDto.action === MultisignAction.RemoveResourceAccount) {
      const action = await this.multisignModel.findOne({
        action: actionDto.action,
      });

      if (action) {
        return false;
      }
    }

    await this.multisignModel.create(actionDto);
    return true;
  }

  async updateAction(updateAction: UpdateActionDto): Promise<boolean> {
    const action = await this.multisignModel.findOne({
      action: updateAction.action,
      targetAddress: updateAction.targetAddress,
    });

    if (!action) {
      return false;
    }

    await this.multisignModel.updateOne(
      {
        _id: action._id,
      },
      {
        signature: updateAction.signature,
      }
    );

    return true;
  }

  async deleteAction(
    deleteActionDto: Partial<DeleteActionDto>
  ): Promise<boolean> {
    const action = await this.multisignModel.findOne({
      action: deleteActionDto.action,
      targetAddress: deleteActionDto.targetAddress,
    });

    if (!action) {
      return false;
    }

    await this.multisignModel.deleteOne({ _id: action._id });

    return true;
  }
}
