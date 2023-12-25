import { BUTTONS } from '../constants';
import { Markup } from 'telegraf';
import { IContext } from '../interface';

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

export function actionButtonsDays(
  language: string = 'ua',
  selectedYear: number,
  selectedMonth: number,
  availableDays: number[],
) {
  const buttons = availableDays.map((day) =>
    Markup.button.callback(day.toString(), `Day:${selectedYear}:${selectedMonth}:${day}`),
  );

  const monthButton = Markup.button.callback(
    `${BUTTONS[language].MONTHS}${selectedMonth}`,
    `selectedDate:${selectedYear}:${selectedMonth}`,
  );
  const backButton = Markup.button.callback(BUTTONS[language].BACK, 'backS');
  const buttonsInColumns: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    buttonsInColumns.push(buttons.slice(i, i + 5));
  }
  buttonsInColumns.push([monthButton, backButton]);

  return Markup.inlineKeyboard(buttonsInColumns);
}

export function backStatisticButton(language: string = 'ua') {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].BACK, 'backS')]);
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

export function actionButtonsStatistics(language: string = 'ua') {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(BUTTONS[language].BALANCE, 'balance'),
      Markup.button.callback(BUTTONS[language].SELECT_YEAR, 'select_year'),
    ],
    [
      Markup.button.callback(BUTTONS[language].TODAY, 'today'),
      Markup.button.callback(BUTTONS[language].WEEK, 'on_week'),
      Markup.button.callback(BUTTONS[language].MONTH, 'on_month'),
    ],
    [
      Markup.button.callback(BUTTONS[language].MY_INCOME, 'my_income'),
      Markup.button.callback(BUTTONS[language].MY_EXPENSE, 'my_expense'),
      Markup.button.callback(BUTTONS[language].BY_CATEGORY, 'by_category'),
    ],
    [Markup.button.callback(BUTTONS[language].BACK, 'back')],
  ]);
}
export function actionButtonsYears(years: number[], language: string = 'ua') {
  const buttons = years.map((year) => Markup.button.callback(year.toString(), `Year:${year}`));

  buttons.push(Markup.button.callback(BUTTONS[language].BACK, 'backS'));

  return Markup.inlineKeyboard(buttons, { columns: 1 });
}
