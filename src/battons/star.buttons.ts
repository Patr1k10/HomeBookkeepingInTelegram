import { Markup } from 'telegraf';
import { BUTTONS } from '../constants';

export function actionButtonsStart(language: string = 'ua', isPremium: boolean = false) {
  const baseButtons = [
    [
      Markup.button.callback(BUTTONS[language].TRANSACTIONS, 'transactions'),
      Markup.button.callback(BUTTONS[language].STATISTICS, 'statistics'),
    ],
    [
      Markup.button.callback(BUTTONS[language].SETTING, 'settings'),
      Markup.button.callback(BUTTONS[language].INFO, 'info'),
    ],
  ];
  if (isPremium) {
    baseButtons.push([Markup.button.callback(`${BUTTONS[language].PREMIUM_BUTTON}`, 'premiumMenu')]);
  }
  return Markup.inlineKeyboard(baseButtons);
}

export function infoButton(language: string = 'ua') {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(BUTTONS[language].FIN, 'financial-literacy'),
      Markup.button.callback(BUTTONS[language].HELP, 'help'),
    ],
    [Markup.button.callback(BUTTONS[language].BACK, 'back')],
  ]);
}

export function backStartButton(language: string = 'ua') {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].BACK, 'back')]);
}

export function backToStartButton(language: string = 'ua') {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].BACK, 'backToStart')]);
}

export function backHelpButton(language: string = 'ua') {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback(BUTTONS[language].SUPPORT, 'project_support'),
      Markup.button.callback(BUTTONS[language].BACK, 'back'),
    ],
    { columns: 1 },
  );
}
