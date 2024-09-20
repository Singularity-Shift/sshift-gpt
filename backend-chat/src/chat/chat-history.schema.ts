import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';

export type ChatHistoryDocument = HydratedDocument<ChatHistory>;

@Schema()
export class ChatHistory {
  @Prop({ type: String, required: true })
  role: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Date, default: now() })
  createdAt: Date;
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);
