import { Markup } from 'telegraf';
import { BUTTONS } from '../constants';

export function actionButtonsSettings(language: string = 'ua', bossId: number) {
  const baseButtons = [
    [
      Markup.button.callback(BUTTONS[language].FAMILY, 'family'),
      Markup.button.callback(BUTTONS[language].LANGUAGE, 'language'),
    ],
    [Markup.button.callback(BUTTONS[language].RESET, 'reset')],
    [
      Markup.button.callback(BUTTONS[language].GET_PREMIUM, 'premium'),
      Markup.button.callback('аналитика бота', 'bot_analytics'),

    ],[Markup.button.callback(BUTTONS[language].BACK, 'back')]
  ];
  if (bossId === +process.env.BOSID) {
    baseButtons[1].push(Markup.button.callback('Адмін😎 панель🔓', 'admin'));
  }
  return Markup.inlineKeyboard(baseButtons);
}
export function languageSet() {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback('Українська🇺🇦', 'setLanguage:ua'),
      Markup.button.callback('English🇬🇧', 'setLanguage:en'),
      Markup.button.callback('Polski🇵🇱', 'setLanguage:pl'),
    ],
    {
      columns: 2,
    },
  );
}

export function currencySet() {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback('Українська🇺🇦 гривня', 'UAH'),
      Markup.button.callback('United States🇺🇸 Dollar﹩', 'USD'),
      Markup.button.callback('Polish🇵🇱 zloty', 'PLN'),
    ],
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
