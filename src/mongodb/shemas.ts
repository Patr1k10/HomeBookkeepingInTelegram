import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum TransactionType {
  INCOME = 'Доход',
  EXPENSE = 'Расход',
}

@Schema()
export class Balance extends Document {
  @Prop({ required: true })
  userId: number;

  @Prop({ required: true })
  balance: number;
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
