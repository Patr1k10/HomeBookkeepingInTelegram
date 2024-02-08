import { TransactionType } from '../shemas/enum/transactionType.enam';

export class CreateTransactionDto {
  userId: number;
  userName: string;
  transactionName: string;
  transactionType: TransactionType;
  amount: number;
}
