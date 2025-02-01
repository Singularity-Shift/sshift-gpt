import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Feature } from './feature.schema';

export type AdminConfigDocument = HydratedDocument<AdminConfig>;

@Schema()
export class AdminConfig {
  @Prop({ type: [Feature], required: true })
  models: Feature[];

  @Prop({ type: [Feature], required: true })
  tools: Feature[];

  @Prop({ type: String, default: '' })
  systemPrompt: string;

  @Prop({ type: String, default: '' })
  reasoningPrompt: string;
}

export const AdminConfigSchema = SchemaFactory.createForClass(AdminConfig);
