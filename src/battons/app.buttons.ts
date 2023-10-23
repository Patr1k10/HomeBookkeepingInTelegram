import { Markup } from 'telegraf';
import { BUTTONS } from '../constants/buttons.const';

export function actionButtonsStart(language: string = 'ua') {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback(BUTTONS[language].BALANCE, 'balance'),
      Markup.button.callback(BUTTONS[language].TRANSACTIONS, 'transactions'),
      Markup.button.callback(BUTTONS[language].STATISTICS, 'statistics'),
      Markup.button.callback(BUTTONS[language].FAMILY, 'family'),
      Markup.button.callback(BUTTONS[language].HELP, 'help'),
      Markup.button.callback(BUTTONS[language].LANGUAGE, 'language'),
      Markup.button.callback(BUTTONS[language].RESET, 'reset'),
    ],
    {
      columns: 2,
    },
  );
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

export function actionButtonsStatistics(language: string = 'ua') {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback(BUTTONS[language].TODAY, 'today'),
      Markup.button.callback(BUTTONS[language].WEEK, 'on_week'),
      Markup.button.callback(BUTTONS[language].MONTH, 'on_month'),
      Markup.button.callback(BUTTONS[language].SELECT_MONTH, 'select_month'),
      Markup.button.callback(BUTTONS[language].MY_INCOME, 'my_income'),
      Markup.button.callback(BUTTONS[language].MY_EXPENSE, 'my_expense'),
      Markup.button.callback(BUTTONS[language].BY_CATEGORY, 'by_category'),
      Markup.button.callback(BUTTONS[language].BACK, 'back'),
    ],
    { columns: 2 },
  );
}
export function backStatisticButton(language: string = 'ua') {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].BACK, 'backS')]);
}
export function backFamilyButton(language: string = 'ua') {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].BACK, 'backF')]);
}

export function backStartButton(language: string = 'ua') {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].BACK, 'back')]);
}
export function backTranButton(language: string = 'ua') {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].BACK, 'backT')]);
}
export function actionButtonsTransactionNames(transactionNames: string[], language: string = 'ua') {
  const buttons = [];
  for (const name of transactionNames) {
    buttons.push(Markup.button.callback(name, `TransactionName:${name}`));
  }

  buttons.push(Markup.button.callback(BUTTONS[language].BACK, 'backS'));

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
    Markup.button.callback(BUTTONS[language].BACK, 'backS'),
  ];
  return Markup.inlineKeyboard(buttons, { columns: 3 });
}

export function groupButton(language: string = 'ua') {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback(BUTTONS[language].GET_ID, 'get_id'),
      Markup.button.callback(BUTTONS[language].ADD_TO_GROUP, 'add_to_group'),
      Markup.button.callback(BUTTONS[language].DELETE_FROM_GROUP, 'remove_group'),
      Markup.button.callback(BUTTONS[language].HELP, 'help'),
      Markup.button.callback(BUTTONS[language].BACK, 'back'),
    ],
    {
      columns: 2,
    },
  );
}
