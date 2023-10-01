import { Context as ContextTelegraf } from 'telegraf';

export interface Context extends ContextTelegraf {
  session: {
    id?: string;
    type?: 'done' | 'edit' | 'remove' | 'income' | 'expense' | 'balance' | 'delete';
    language?: string;
  };
}

export interface CustomCallbackQuery {
  id: string;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    language_code: string;
  };
  message: {
    message_id: number;
    // Другие свойства message
  };
  chat_instance: string;
  data: string;
  // Другие свойства CustomCallbackQuery
}
