import { Markup } from 'telegraf';

export function actionButtonsAdmin(language: string = 'ua') {
  const baseButtons = [
    [Markup.button.callback('Отримати статистуки по боту', 'adminStat')],
    [Markup.button.callback('Відправити новини', 'sendNews')],
    [Markup.button.callback('Заглушка', 'Заглушка'), Markup.button.callback('Повирнутися ↩️', 'back')],
  ];
  return Markup.inlineKeyboard(baseButtons);
}
export function actionButtonsAdminStat(language: string = 'ua') {
  const baseButtons = [
    [Markup.button.callback('головна статистика бота', 'getAdminStat')],
    [
      Markup.button.callback('Най популярніші транзакції', 'popularTransactions'),
      Markup.button.callback('Топ юзерів ', 'toUser'),
    ],
    [, Markup.button.callback('Повирнутися ↩️', 'backA')],
  ];
  return Markup.inlineKeyboard(baseButtons);
}

export function actionButtonsAdminBack() {
  const baseButtons = [[Markup.button.callback('Повирнутися ↩️', 'backA')]];
  return Markup.inlineKeyboard(baseButtons);
}
