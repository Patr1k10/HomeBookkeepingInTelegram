import { Markup } from 'telegraf';
import { BUTTONS } from '../constants';

export function actionButtonsAdvancedStatistics(language: string = 'ua') {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${BUTTONS[language].TOP10}`, 'top10'), Markup.button.callback(``, 'вапр')],
    [Markup.button.callback(``, 'апвр'), Markup.button.callback(``, 'on_week'), Markup.button.callback(``, 'on_month')],
    [
      Markup.button.callback(``, 'my_income'),
      Markup.button.callback(``, 'my_expense'),
      Markup.button.callback(``, 'by_category'),
    ],
    [Markup.button.callback(BUTTONS[language].BACK, 'backS')],
  ]);
}
