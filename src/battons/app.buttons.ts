import { Markup } from 'telegraf';
import { BUTTONS } from '../constants/buttons.const';

export function actionButtonsStart(language: string = 'ua') {
  return Markup.keyboard(
    [
      Markup.button.callback(BUTTONS[language].BALANCE, 'Баланс'),
      Markup.button.callback(BUTTONS[language].TRANSACTIONS, 'Транзакції'),
      Markup.button.callback(BUTTONS[language].STATISTICS, 'Статистика'),
      Markup.button.callback(BUTTONS[language].FAMILY, 'Родина'),
    ],
    {
      columns: 2,
    },
  ).resize();
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
    {
      columns: 1,
    },
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

export function actionButtonsTransaction(language: string = 'ua') {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback(BUTTONS[language].INCOME, 'Приход'),
      Markup.button.callback(BUTTONS[language].EXPENSE, 'Расход'),
      Markup.button.callback(BUTTONS[language].DELETE_LAST, 'Удаление последних️'),
    ],
    { columns: 2 },
  );
}

export function actionButtonsStatistics(language: string = 'ua') {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback(BUTTONS[language].TODAY, 'За сегодня'),
      Markup.button.callback(BUTTONS[language].WEEK, 'За неделю'),
      Markup.button.callback(BUTTONS[language].MONTH, 'За месяц'),
      Markup.button.callback(BUTTONS[language].SELECT_MONTH, 'Выбрать месяц'),
      Markup.button.callback(BUTTONS[language].MY_INCOME, 'Мои приходы'),
      Markup.button.callback(BUTTONS[language].MY_EXPENSE, 'Мои расходы'),
      Markup.button.callback(BUTTONS[language].BY_CATEGORY, 'По категории'),
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

export function actionButtonsMonths(language: string = 'ua') {
  const buttons = [
    Markup.button.callback(BUTTONS[language].JANUARY, 'Month:1'),
    Markup.button.callback(BUTTONS[language].FEBRUARY, 'Month:2'),
    Markup.button.callback(BUTTONS[language].MARCH, 'Month:3'),
    Markup.button.callback(BUTTONS[language].APRIL, 'Month:4'),
    Markup.button.callback(BUTTONS[language].MAY, 'Month:5'),
    Markup.button.callback(BUTTONS[language].JUNE, 'Month:6'),
    Markup.button.callback(BUTTONS[language].JULY, 'Month:7'),
    Markup.button.callback(BUTTONS[language].AUGUST, 'Month:8'),
    Markup.button.callback(BUTTONS[language].SEPTEMBER, 'Month:9'),
    Markup.button.callback(BUTTONS[language].OCTOBER, 'Month:10'),
    Markup.button.callback(BUTTONS[language].NOVEMBER, 'Month:11'),
    Markup.button.callback(BUTTONS[language].DECEMBER, 'Month:12'),
  ];
  return Markup.inlineKeyboard(buttons, { columns: 3 });
}
