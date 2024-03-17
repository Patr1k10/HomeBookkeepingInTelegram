import { TransactionType } from '../enum/transactionType.enam';

export interface ITransactionQuery {
  userId?: number;
  transactionType?: TransactionType;
  timestamp?: { $gte: Date; $lte: Date };
}
