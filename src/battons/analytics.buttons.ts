import { Markup } from 'telegraf';
import { BUTTONS } from '../constants';

export function actionButtonsAnalytics(language: string = 'ua') {
  const baseButtons = [
    [Markup.button.callback('За сьогодні ', 'for_today'), Markup.button.callback('За тиждень', 'for_week')],
    [Markup.button.callback('За місяць', 'for_month'), Markup.button.callback('За три місяці', 'for_3_month')],
    [Markup.button.callback(BUTTONS[language].BACK, 'backSettings')],
  ];
  return Markup.inlineKeyboard(baseButtons);
}

export function actionButtonsBackSettings(language: string = 'ua') {
  const baseButtons = [[Markup.button.callback(BUTTONS[language].BACK, 'backSettings')]];
  return Markup.inlineKeyboard(baseButtons);
}
