import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { FeatureActivity } from './feature-used.schema';

export type ActivityDocument = HydratedDocument<Activity>;

@Schema()
export class Activity {
  @Prop({ type: [FeatureActivity] })
  models: FeatureActivity[];

  @Prop({ type: [FeatureActivity] })
  tools: FeatureActivity[];
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
