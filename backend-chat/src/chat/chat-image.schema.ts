import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatImageDocument = HydratedDocument<ChatImage>;

@Schema()
export class ChatImage {
  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String, required: true })
  detail: string;
}

export const ChatImageSchema = SchemaFactory.createForClass(ChatImage);
