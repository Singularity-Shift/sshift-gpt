import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReqLimitDocument = HydratedDocument<ReqLimit>;

@Schema({ _id: false })
export class ReqLimit {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true, name: 'req_limit' })
  reqLimit: string;
}

export const ReqLimitSchema = SchemaFactory.createForClass(ReqLimit);
