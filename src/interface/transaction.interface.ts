export interface Transaction {
  userName: string;
  userId: number;
  transactionName: string;
  transactionType: 'Доход' | 'Расход';
  amount: number;
  timestamp: Date;
  __v: number;
}
