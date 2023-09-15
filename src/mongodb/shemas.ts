import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TransactionType {
  INCOME = 'доход',
  EXPENSE = 'расходы',
}

@Schema()
export class Balance extends Document {
  @Prop({ required: true })
  userId: number;

  @Prop({ required: true })
  balance: number;

  @Prop({
    required: true,
    type: [{ type: Types.ObjectId, ref: 'Transaction' }],
  })
  transactions: Types.ObjectId[];
}

@Schema()
export class Transaction extends Document {
  @Prop({ required: true })
  userId: number;

  @Prop({ required: true })
  transactionName: string;

  @Prop({ required: true, enum: TransactionType })
  transactionType: TransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: Date.now() })
  timestamp: Date;
}

export const BalanceSchema = SchemaFactory.createForClass(Balance);
export const TransactionSchema = SchemaFactory.createForClass(Transaction);
