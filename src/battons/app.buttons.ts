import { Markup } from 'telegraf';
import { BUTTONS } from '../constants';
import { IContext } from '../interface';

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
      Markup.button.callback(BUTTONS[language].SELECT_YEAR, 'select_year'),
      // Markup.button.callback(BUTTONS[language].SELECT_MONTH, 'select_month'),
      Markup.button.callback(BUTTONS[language].MY_INCOME, 'my_income'),
      Markup.button.callback(BUTTONS[language].MY_EXPENSE, 'my_expense'),
      Markup.button.callback(BUTTONS[language].BY_CATEGORY, 'by_category'),
      Markup.button.callback(BUTTONS[language].BACK, 'back'),
    ],
    { columns: 2 },
  );
}
export function backStatisticButtonMessage(language: string = 'ua', ctx: IContext) {
  const buttons = [Markup.button.callback(BUTTONS[language].BACK, 'backS')];

  if (ctx.session.selectedDate) {
    buttons.push(
      Markup.button.callback(
        BUTTONS[language].DETAILS,
        `details:${ctx.session.selectedYear}:${ctx.session.selectedMonth}:${ctx.session.selectedDate}`,
      ),
    );
  }

  return Markup.inlineKeyboard(buttons);
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
export function backTranButton(language: string = 'ua') {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].BACK, 'backT')], { columns: 1 });
}
export function actionButtonsTransactionNames(transactionNames: string[], language: string = 'ua') {
  const buttons = [];
  for (const name of transactionNames) {
    buttons.push(Markup.button.callback(name, `TransactionName:${name}`));
  }

  buttons.push(Markup.button.callback(BUTTONS[language].BACK, 'backS'));

  return Markup.inlineKeyboard(buttons, { columns: 2 });
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
export function actionButtonsYears(years: number[], language: string = 'ua') {
  const buttons = years.map((year) => Markup.button.callback(year.toString(), `Year:${year}`));

  buttons.push(Markup.button.callback(BUTTONS[language].BACK, 'backS'));

  return Markup.inlineKeyboard(buttons, { columns: 1 });
}

export function actionButtonsDays(
  language: string = 'ua',
  selectedYear: number,
  selectedMonth: number,
  availableDays: number[],
) {
  const buttons = availableDays.map((day) =>
    Markup.button.callback(day.toString(), `Day:${selectedYear}:${selectedMonth}:${day}`),
  );

  buttons.push(
    Markup.button.callback(
      `${BUTTONS[language].MONTHS}${selectedMonth}`,
      `selectedDate:${selectedYear}:${selectedMonth}`,
    ),
    Markup.button.callback(BUTTONS[language].BACK, 'backS'),
  );

  return Markup.inlineKeyboard(buttons, { columns: 2 });
}
export function actionButtonsMonths(language: string = 'ua', selectedYear: number, availableMonths: number[]) {
  const monthNames = [
    BUTTONS[language].JANUARY,
    BUTTONS[language].FEBRUARY,
    BUTTONS[language].MARCH,
    BUTTONS[language].APRIL,
    BUTTONS[language].MAY,
    BUTTONS[language].JUNE,
    BUTTONS[language].JULY,
    BUTTONS[language].AUGUST,
    BUTTONS[language].SEPTEMBER,
    BUTTONS[language].OCTOBER,
    BUTTONS[language].NOVEMBER,
    BUTTONS[language].DECEMBER,
  ];

  const buttons = availableMonths.map((month) =>
    Markup.button.callback(monthNames[month - 1], `Month:${selectedYear}:${month}`),
  );

  buttons.push(
    Markup.button.callback(`${BUTTONS[language].YEARS}${selectedYear}`, `selectedDate:${selectedYear}`),
    Markup.button.callback(BUTTONS[language].BACK, 'backS'),
  );

  return Markup.inlineKeyboard(buttons, { columns: 2 });
}

export function acceptButton(language: string = 'ua', recipientId: number) {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].ACCEPT, `accept_user:${recipientId}`)]);
}