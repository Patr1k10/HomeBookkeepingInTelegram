import { Markup } from 'telegraf';
import { BUTTONS, currencyFlagMapping, CURRNCY } from '../constants';
import { ICryptoAsset, ICurrencyRates } from '../interface';

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

export function actionButtonsPremiumMenu(language: string = 'ua') {
  const baseButtons = [
    [Markup.button.callback(`${BUTTONS[language].CURRENCY}`, 'exchange_rate')],
    [Markup.button.callback(`${BUTTONS[language].CRYPTO}`, 'crypto_currency_course')],
    [Markup.button.callback(BUTTONS[language].BACK, 'back')],
  ];

  return Markup.inlineKeyboard(baseButtons);
}

export function generateCurrencyButtons(currencyData: any[], language: string = 'ua') {
  const buttons = currencyData.map((currency) => {
    const flag = currencyFlagMapping[currency.currencyCode] || '';
    return Markup.button.callback(
      `${flag} ${currency.currencyCode}`,
      `Currency:${currency.currencyName}:${currency.buyRate}:${currency.sellRate}`,
    );
  });

  buttons.push(Markup.button.callback(BUTTONS[language].BACK, 'backP'));

  return Markup.inlineKeyboard(buttons, { columns: 3 });
}
export function generateCryptoButtons(cryptoAssetData: ICryptoAsset[], language: string = 'ua') {
  const buttons = cryptoAssetData.map((crypto) => {
    return Markup.button.callback(
      `${crypto.symbol}`,
      `Crypto:${crypto.name}:${crypto.symbol}:${crypto.priceUsd}:${crypto.changePercent24Hr}`,
    );
  });

  buttons.push(Markup.button.callback(BUTTONS[language].BACK, 'backP'));

  return Markup.inlineKeyboard(buttons, { columns: 3 });
}
export function actionButtonsBackPremium(language: string = 'ua') {
  const baseButtons = [[Markup.button.callback(BUTTONS[language].BACK, 'backP')]];

  return Markup.inlineKeyboard(baseButtons);
}
