import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FeatureDocument = HydratedDocument<Feature>;

@Schema({ _id: false })
export class Feature {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true, name: 'credits' })
  credits: number;
}

export const FeatureSchema = SchemaFactory.createForClass(Feature);
