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
    text: string;
    // Другие свойства message
  };
  chat_instance: string;
  data: string;
  // Другие свойства CustomCallbackQuery
}
