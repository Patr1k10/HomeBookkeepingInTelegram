import { Markup } from 'telegraf';

export function actionButtonsStart() {
  return Markup.keyboard(
    [Markup.button.callback('Баланс 💰', 'Баланс'), Markup.button.callback('Транзакція 💸', 'Транзакція')],
    {
      columns: 2,
    },
  ).resize();
}

export function actionButtonsTransaction() {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback('Надходження 💹', 'Приход'),
      Markup.button.callback('Витрати 🛍️', 'Расход'),
      Markup.button.callback('Видалення останніх️❌', 'Удаление последних️'),
    ],
    { columns: 2 },
  );
}

export function actionButtonsStatistics() {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback('За сьогодні', 'За сегодня'),
      Markup.button.callback('За тиждень🗓️', 'За неделю'),
      Markup.button.callback('За місяць🗓️', 'За месяц'),
      Markup.button.callback('Вибрати місяць📤️', 'Выбрать месяц'),
      Markup.button.callback('Мої надходження💵', 'Мои приходы'),
      Markup.button.callback('Мої витрати🧾', 'Мои расходы'),
      Markup.button.callback('За категорією🗃️', 'По категории'),
    ],
    { columns: 2 },
  );
}
export function actionButtonsTransactionNames(transactionNames: string[]) {
  const buttons = [];
  for (const name of transactionNames) {
    buttons.push(Markup.button.callback(name, `TransactionName:${name}`));
  }
  return Markup.inlineKeyboard(buttons, { columns: 2 });
}

export function actionButtonsMonths() {
  const months = [
    'Січень',
    'Лютий',
    'Березень',
    'Квітень',
    'Травень',
    'Червень',
    'Липень',
    'Серпень',
    'Вересень',
    'Жовтень',
    'Листопад',
    'Грудень',
  ];
  const buttons = months.map((month, index) => Markup.button.callback(month, `Month:${index + 1}`));
  return Markup.inlineKeyboard(buttons, { columns: 3 });
}
