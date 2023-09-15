import { TransactionType } from '../mongodb/shemas';

export class CreateBalanceDto {
  userId: number;
  balance?: number;
}

export class CreateTransactionDto {
  userId: number;
  transactionName: string;
  transactionType: TransactionType;
  amount: number;
}
