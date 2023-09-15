import { Context as ContextTelegraf } from 'telegraf';

export interface Context extends ContextTelegraf {
  session: {
    id?: string;
    type?: 'done' | 'edit' | 'remove' | 'income' | 'expense' | 'balance';
  };
}
