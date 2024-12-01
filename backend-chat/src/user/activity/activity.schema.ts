import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ReqUsed } from './req-used.schema';

export type ActivityDocument = HydratedDocument<Activity>;

@Schema()
export class Activity {
  @Prop({ type: [ReqUsed] })
  models: ReqUsed[];

  @Prop({ type: [ReqUsed] })
  tools: ReqUsed[];
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
