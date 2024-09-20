import { Chat } from '../chat/chat.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, now } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' })
  chats: Chat[];

  @Prop({ type: Date, default: now() })
  createdAt: Date;

  @Prop({ type: Date, default: now() })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
