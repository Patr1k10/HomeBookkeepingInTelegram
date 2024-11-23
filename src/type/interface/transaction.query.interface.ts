import { TransactionType } from '../enum/transactionType.enam';

export interface ITransactionQuery {
  userId?: number;
  transactionName?: string;
  transactionType?: TransactionType;
  timestamp?: { $gte: Date; $lte: Date };
}
