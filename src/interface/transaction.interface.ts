export interface Transaction {
  userId: number;
  transactionName: string;
  transactionType: 'доход' | 'расход';
  amount: number;
  timestamp: Date;
  __v: number;
}
