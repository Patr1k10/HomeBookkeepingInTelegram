import { Context as ContextTelegraf } from 'telegraf';
import { ITransactionQuery } from './transaction.query.interface';

export interface IContext extends ContextTelegraf {
  session: {
    id?: string;
    type?: 'done' | 'edit' | 'remove' | 'income' | 'expense' | 'balance' | 'delete' | 'sendNewsAllUser';
    language?: string;
    currency?: string;
    group?: number[];
    awaitingUserIdInput?: boolean;
    lastBotMessage?: number;
    lastActivity?: number;
    selectedYear?: number;
    selectedMonth?: number;
    selectedDate?: number;
    isPremium?: boolean;
    compare?: string[];
    transactionQuery?: ITransactionQuery;
  };
}
