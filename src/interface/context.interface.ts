import { Context as ContextTelegraf } from 'telegraf';

export interface IContext extends ContextTelegraf {
  session: {
    id?: string;
    type?: 'done' | 'edit' | 'remove' | 'income' | 'expense' | 'balance' | 'delete';
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
  };
}
