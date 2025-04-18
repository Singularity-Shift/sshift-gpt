import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ChatHistory } from './chat-history.schema';
import { ChatUsage } from './chat-usage.schema';

export type ChatDocument = HydratedDocument<Chat>;

@Schema({ _id: false })
export class Chat {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: false })
  title: string;

  @Prop({ type: String, required: true })
  model: string;

  @Prop({ type: [ChatHistory] })
  messages: ChatHistory[];

  @Prop({ type: Number, required: true, default: Date.now })
  createdAt: number;

  @Prop({ type: Number, required: true, default: Date.now })
  lastUpdated: number;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
