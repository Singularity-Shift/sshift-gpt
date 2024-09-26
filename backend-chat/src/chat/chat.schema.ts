import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ChatHistory } from './chat-history.schema';
import { ChatUsage } from './chat-usage.schema';

export type ChatDocument = HydratedDocument<Chat>;

@Schema({ _id: false })
export class Chat {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  model: string;

  @Prop({ type: String, required: true })
  system_fingerprint: string;

  @Prop({ type: [ChatHistory] })
  messages: ChatHistory[];

  @Prop({ type: ChatUsage })
  usage: ChatUsage;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
