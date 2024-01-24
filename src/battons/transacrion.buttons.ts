import { Markup } from 'telegraf';
import { BUTTONS } from '../constants';

export function actionButtonsTransaction(language: string = 'ua') {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback(BUTTONS[language].INCOME, 'income'),
      Markup.button.callback(BUTTONS[language].EXPENSE, 'expense'),
      Markup.button.callback(BUTTONS[language].DELETE_LAST, 'delete_last'),
      Markup.button.callback(BUTTONS[language].BACK, 'back'),
    ],
    { columns: 2 },
  );
}
export function backTranButton(language: string = 'ua') {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].BACK, 'backT')], { columns: 1 });
}

export function actionButtonsTransactionNames(transactionNames: string[], language: string = 'ua') {
  const buttons = [];
  for (const name of transactionNames) {
    buttons.push(Markup.button.callback(name, `TransactionName:${name}`));
  }

  buttons.push(Markup.button.callback(BUTTONS[language].BACK, 'backS'));

  return Markup.inlineKeyboard(buttons, { columns: 3 });
}
