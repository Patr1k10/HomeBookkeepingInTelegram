import { Markup } from 'telegraf';

export function actionButtonsStart() {
  return Markup.keyboard(
    [Markup.button.callback('Баланс 💰', 'Баланс'), Markup.button.callback('Транзакция 💸', 'Транзакция')],
    {
      columns: 2,
    },
  );
}

export function actionButtonsTransaction() {
  return Markup.inlineKeyboard([
    Markup.button.callback('Приход 💹', 'Приход'),
    Markup.button.callback('Расход 🛍️', 'Расход'),
  ]);
}

export function actionButtonsStatistics() {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback('За сегодня', 'За сегодня'),
      Markup.button.callback('За неделю🗓️', 'За неделю'),
      Markup.button.callback('За месяц🗓️', 'За месяц'),
      Markup.button.callback('Мои приходы💵', 'Мои приходы'),
      Markup.button.callback('Мои расходы🧾', 'Мои расходы'),
      Markup.button.callback('По категории🗃️', 'По категории'),
    ],
    { columns: 3 },
  );
}
export function actionButtonsTransactionNames(transactionNames: string[]) {
  const buttons = [];
  for (const name of transactionNames) {
    buttons.push(Markup.button.callback(name, `TransactionName:${name}`));
  }
  return Markup.inlineKeyboard(buttons, { columns: 2 });
}
