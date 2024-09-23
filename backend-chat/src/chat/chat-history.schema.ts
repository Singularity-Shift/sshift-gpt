import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, now } from 'mongoose';
import { ChatContent } from './chat-content.schema';

export type ChatHistoryDocument = HydratedDocument<ChatHistory>;

@Schema()
export class ChatHistory {
  @Prop({ type: String, required: true })
  role: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ChatContent' })
  content: ChatContent[];

  @Prop({ type: Date, default: now() })
  createdAt: Date;
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);
