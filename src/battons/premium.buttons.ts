import { Markup } from 'telegraf';
import { BUTTONS } from '../constants';

export function actionButtonsPremium(language: string = 'ua', isPremium: boolean = false) {
  const baseButtons = [[Markup.button.callback(`${BUTTONS[language].SET_PREMIUM}`, 'setPremium')]];
  if (isPremium) {
    baseButtons[0].push(Markup.button.callback(`${BUTTONS[language].DAY_PREMIUM}`, 'getPremium'));
  }
  baseButtons.push([Markup.button.callback(BUTTONS[language].BACK, 'back')]);
  return Markup.inlineKeyboard(baseButtons);
}
export function actionSetPremium(language: string = 'ua', isPremium: boolean = false) {
  const baseButtons = [[Markup.button.callback(`${BUTTONS[language].TRIAL_PREMIUM}`, 'trialPremium')]];
  baseButtons.push([Markup.button.callback(BUTTONS[language].BACK, 'back')]);
  return Markup.inlineKeyboard(baseButtons);
}
