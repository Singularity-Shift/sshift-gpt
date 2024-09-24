import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, now } from 'mongoose';
import { ChatImage } from './chat-image.schema';

export type ChatContentDocument = HydratedDocument<ChatContent>;

@Schema()
export class ChatContent {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: false })
  text: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatImage',
    required: false,
  })
  image_url: ChatImage;

  @Prop({ type: Date, default: now() })
  createdAt: Date;
}

export const ChatContentSchema = SchemaFactory.createForClass(ChatContent);
