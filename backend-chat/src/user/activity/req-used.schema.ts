import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReqUsedDocument = HydratedDocument<ReqUsed>;

@Schema({ _id: false })
export class ReqUsed {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true, name: 'req_used' })
  reqUsed: number;
}

export const ReqUsedSchema = SchemaFactory.createForClass(ReqUsed);
