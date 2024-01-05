import { Markup } from 'telegraf';
import { BUTTONS } from '../constants';

export function actionButtonsSettings(language: string = 'ua') {
  const baseButtons = [
    [
      Markup.button.callback(BUTTONS[language].FAMILY, 'family'),
      Markup.button.callback(BUTTONS[language].LANGUAGE, 'language'),
    ],
    [Markup.button.callback(BUTTONS[language].RESET, 'reset')],
    [
      Markup.button.callback(BUTTONS[language].GET_PREMIUM, 'premium'),
      Markup.button.callback(BUTTONS[language].BACK, 'back'),
    ],
  ];
  return Markup.inlineKeyboard(baseButtons);
}
export function languageSet() {
  return Markup.inlineKeyboard(
    [Markup.button.callback('Українська🇺🇦', 'setLanguage:ua'), Markup.button.callback('English🇬🇧', 'setLanguage:en')],
    {
      columns: 2,
    },
  );
}

export function currencySet() {
  return Markup.inlineKeyboard(
    [Markup.button.callback('Українська🇺🇦 гривня', 'UAH'), Markup.button.callback('United States Dollar﹩', 'USD')],
    { columns: 1 },
  );
}
export function resetButton(language: string = 'ua') {
  return Markup.inlineKeyboard(
    [Markup.button.callback(BUTTONS[language].YES, 'yes'), Markup.button.callback(BUTTONS[language].NO, 'no')],
    {
      columns: 2,
    },
  );
}
