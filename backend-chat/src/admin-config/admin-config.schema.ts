import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ReqLimit } from './req-limit.schema';

export type AdminConfigDocument = HydratedDocument<AdminConfig>;

@Schema()
export class AdminConfig {
  @Prop({ type: [ReqLimit] })
  models: ReqLimit[];

  @Prop({ type: [ReqLimit] })
  tools: ReqLimit[];
}

export const AdminConfigSchema = SchemaFactory.createForClass(AdminConfig);
