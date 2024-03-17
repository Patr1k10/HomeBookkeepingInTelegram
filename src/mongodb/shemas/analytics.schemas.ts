import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Analytics extends Document {
  @Prop({ default: Date.now })
  day: Date;

  @Prop({ required: true })
  allUserCount: number;

  @Prop({ required: true })
  activeUsersCount: number;

  @Prop({ required: true })
  premiumUsersCount: number;

  @Prop({ required: true })
  bannedUsersCount: number;

  @Prop({ required: true })
  totalTransactionsCount: number;

  @Prop({ required: true })
  totalNegativeTransactionVolume: number;

  @Prop({ required: true })
  totalPositiveTransactionVolume: number;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);
