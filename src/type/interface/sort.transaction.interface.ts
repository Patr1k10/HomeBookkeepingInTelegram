export interface SortTransactionInterface {
  name: string;
  sum: number;
  percentage: string;
  userName: string;
}

export interface TransactionSums {
  [transactionName: string]: { sum: number; userName: string };
}
