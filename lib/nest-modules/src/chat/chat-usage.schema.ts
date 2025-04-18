import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatUsageDocument = HydratedDocument<ChatUsage>;

@Schema({ _id: false })
export class ChatUsage {
  @Prop({ type: Number, required: true })
  prompt_tokens: number;

  @Prop({ type: Number, required: true })
  completion_tokens: number;

  @Prop({ type: Number, required: true })
  total_tokens: number;
}

export const ChatUsageSchema = SchemaFactory.createForClass(ChatUsage);
