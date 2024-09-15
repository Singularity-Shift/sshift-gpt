import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ChatHistory } from './chat-history.schema';
import { ChatUsage } from './chat-usage.schema';

export type ChatDocument = HydratedDocument<Chat>;

@Schema()
export class Chat {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  model: string;

  @Prop({ type: String, required: true })
  system_fingerprint: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ChatHistory' })
  chatHistory: ChatHistory[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ChatUsage' })
  chatUsage: ChatUsage;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
