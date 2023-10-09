import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Balance extends Document {
  @Prop({ required: true })
  userId: number;

  @Prop({ required: true })
  balance: number;
}

export const BalanceSchema = SchemaFactory.createForClass(Balance);
