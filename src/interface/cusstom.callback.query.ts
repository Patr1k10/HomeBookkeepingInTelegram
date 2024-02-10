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
    photo?: [];
  };
  chat_instance: string;
  data: string;
}
