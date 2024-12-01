import { Chat } from '../chat/chat.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, Schema as SchemaType } from 'mongoose';
import { Activity } from './activity/activity.schema';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: [Chat] })
  chats: Chat[];

  @Prop({ type: SchemaType.Types.ObjectId, ref: Activity.name })
  activity: Activity;

  @Prop({ type: Date, default: now() })
  createdAt: Date;

  @Prop({ type: Date, default: now() })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
