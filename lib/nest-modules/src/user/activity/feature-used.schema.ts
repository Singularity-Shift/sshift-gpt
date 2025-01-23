import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FeatureActivityDocument = HydratedDocument<FeatureActivity>;

@Schema({ _id: false })
export class FeatureActivity {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true, name: 'feature_used' })
  creditsUsed: number;
}

export const FeatureActivitySchema =
  SchemaFactory.createForClass(FeatureActivity);
