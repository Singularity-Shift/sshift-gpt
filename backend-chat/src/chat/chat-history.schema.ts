import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';
import { ChatContent } from './chat-content.schema';
// import { ChatContent } from './chat-content.schema';

export type ChatHistoryDocument = HydratedDocument<ChatHistory>;

@Schema({ _id: false })
export class ChatHistory {
  @Prop({ type: String, required: true })
  role: string;

  @Prop({ type: String || [ChatContent] })
  content: ChatContent[];

  @Prop({ type: Date, default: now() })
  createdAt: Date;
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);
