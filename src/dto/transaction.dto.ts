import { TransactionType } from '../shemas/enum/transactionType.enam';

export class CreateTransactionDto {
  userId: number;
  transactionName: string;
  transactionType: TransactionType;
  amount: number;
}