import { Markup } from 'telegraf';
import { BUTTONS, FINANCE_LITERACY_BUTTON_TEXT } from '../constants';

export function financialLiteracyButtons(language: string = 'ua') {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback(FINANCE_LITERACY_BUTTON_TEXT[language], 'compound-interest'),
      Markup.button.callback(BUTTONS[language].BACK, 'back'),
    ],
    {
      columns: 1,
    },
  );
}
