import { MultisignAction } from '@helpers';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';

export type MultisignDocument = HydratedDocument<Multisign>;

@Schema()
export class Multisign {
  @Prop({
    type: String,
    enum: [
      MultisignAction.AddCollector,
      MultisignAction.RemoveCollector,
      MultisignAction.RemoveResourceAccount,
    ],
    required: true,
  })
  action: MultisignAction;

  @Prop({ type: String })
  transaction: string;

  @Prop({ type: String })
  signature: string;

  @Prop({ type: String })
  targetAddress: string;

  @Prop({ type: Date, default: now() })
  createdAt: Date;

  @Prop({ type: Date, default: now() })
  updatedAt: Date;
}

export const MultisignSchema = SchemaFactory.createForClass(Multisign);
