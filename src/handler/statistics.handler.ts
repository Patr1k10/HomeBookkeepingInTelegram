import { Logger } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { TransactionType } from '../type/enum/transactionType.enam';
import { StatisticsService } from '../service';
import {
  PERIOD_NULL,
  SELECT_CATEGORY_MESSAGE,
  SELECT_DAY_MESSAGE,
  SELECT_MONTH_MESSAGE,
  SELECT_YEAR_MESSAGE,
  WANT_STATISTICS_MESSAGE,
} from '../constants';
import { CustomCallbackQuery, IContext } from '../type/interface';
import {
  actionButtonsDays,
  actionButtonsMonths,
  actionButtonsStatistics,
  actionButtonsTransactionNames,
  actionButtonsYears,
  backStatisticButton,
} from '../battons';
import { resetSession } from '../common/reset.session';
import { WizardContext } from 'telegraf/typings/scenes';

@Update()
export class StatisticsHandler {
  private readonly logger: Logger = new Logger(StatisticsHandler.name);
  constructor(private readonly statisticsService: StatisticsService) {}

  @Action('statistics')
  async statisticsCommand(ctx: IContext) {
    await ctx.editMessageText(
      WANT_STATISTICS_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsStatistics(ctx.session.language || 'ua'),
    );
    this.logger.log(`user:${ctx.from.id} statistics command executed`);
  }

  @Action('my_income')
  async incomeListCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} my_income command executed`);
    await this.statisticsService.getTransactionsByType(ctx, TransactionType.INCOME);
  }

  @Action('my_expense')
  async expenseListCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} my_expense command executed`);
    await this.statisticsService.getTransactionsByType(ctx, TransactionType.EXPENSE);
  }
  @Action('by_category')
  async categoryListCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} by_category`);
    const uniqueTransactionNames = await this.statisticsService.getUniqueTransactionNames(ctx);
    if (uniqueTransactionNames === null) {
      await ctx.editMessageText(PERIOD_NULL[ctx.session.language], backStatisticButton(ctx.session.language || 'ua'));
      return;
    }
    const transactionNameButtons = actionButtonsTransactionNames(uniqueTransactionNames, ctx.session.language);
    await ctx.editMessageText(SELECT_CATEGORY_MESSAGE[ctx.session.language || 'ua'], transactionNameButtons);
  }

  @Action(/TransactionName:(.+)/)
  async transactionNameCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} transactionName command executed`);
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const selectedTransactionName = parts[1];
      await this.statisticsService.getTransactionsByTransactionName(ctx, selectedTransactionName);
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Action('today')
  async todayListCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} today command executed`);
    await this.statisticsService.getFormattedTransactionsForToday(ctx);
  }
  @Action('on_week')
  async weekListCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} week command executed`);
    await this.statisticsService.getFormattedTransactionsForWeek(ctx);
  }
  @Action('on_month')
  async monthListCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} month command executed`);
    await this.statisticsService.getFormattedTransactionsForMonth(ctx);
  }

  @Action('select_year')
  async yearListMenuCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} year menu command executed`);
    const uniqueYears = await this.statisticsService.getUniqueYears(ctx.from.id);
    const yearButtons = actionButtonsYears(uniqueYears, ctx.session.language);
    await ctx.editMessageText(SELECT_YEAR_MESSAGE[ctx.session.language || 'ua'], yearButtons);
  }

  @Action(/Year:(.+)/)
  async specificYearListCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} specific year command executed`);
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      ctx.session.selectedYear = Number(parts[1]);
      await this.monthListMenuCommand(ctx);
    } else {
      this.logger.log(`user:${ctx.from.id} callbackQuery is undefined`);
    }
  }
  @Action('select_month')
  async monthListMenuCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} month menu command executed`);
    const availableMonths = await this.statisticsService.getUniqueMonths(ctx.session.selectedYear, ctx.from.id);
    await ctx.editMessageText(
      SELECT_MONTH_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsMonths(ctx.session.language, ctx.session.selectedYear, availableMonths),
    );
  }

  @Action(/selectedDate:(\d+)(?::(\d+))?/)
  async handleSelectedDate(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} selectedDate command executed`);
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.match(/selectedDate:(\d+)(?::(\d+))?/);
      if (parts) {
        const selectedYear = Number(parts[1]);
        const selectedMonth = parts[2] ? Number(parts[2]) : null;
        if (selectedMonth === null) {
          const fromDate = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
          const toDate = new Date(selectedYear + 1, 0, 1, 0, 0, 0, 0);
          await this.statisticsService.getTransactionsByPeriod(ctx, fromDate, toDate);
        } else {
          const fromDate = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
          const toDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
          await this.statisticsService.getTransactionsByPeriod(ctx, fromDate, toDate);
        }
      } else {
        this.logger.log(`user:${ctx.from.id} Failed to parse callbackData`);
      }
    } else {
      this.logger.log(`user:${ctx.from.id} callbackQuery is undefined`);
    }
  }

  @Action(/Day:(\d+):(\d+):(\d+)/)
  async specificDayListCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} specific Day command executed`);
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const selectedYear = Number(parts[1]);
      const selectedMonth = Number(parts[2]);
      const selectedDay = Number(parts[3]);
      ctx.session.selectedYear = selectedYear;
      ctx.session.selectedMonth = selectedMonth;
      ctx.session.selectedDate = selectedDay;
      const fromDate = new Date(selectedYear, selectedMonth - 1, selectedDay, 0, 0, 0, 0);
      const toDate = new Date(selectedYear, selectedMonth - 1, selectedDay, 23, 59, 59, 999);
      await this.statisticsService.getTransactionsByPeriod(ctx, fromDate, toDate);
    } else {
      this.logger.log(`user:${ctx.from.id} callbackQuery is undefined`);
    }
  }
  @Action(/Month:(\d+):(\d+)/)
  async specificMonthListCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} specific month command executed`);
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const selectedYear = Number(parts[1]);
      const selectedMonth = Number(parts[2]);
      const availableDays = await this.statisticsService.getUniqueDays(selectedYear, selectedMonth, ctx.from.id);
      ctx.session.selectedYear = selectedYear;
      ctx.session.selectedMonth = selectedMonth;
      await ctx.editMessageText(
        SELECT_DAY_MESSAGE[ctx.session.language || 'ua'],
        actionButtonsDays(ctx.session.language, selectedYear, selectedMonth, availableDays),
      );
    } else {
      this.logger.log(`user:${ctx.from.id} callbackQuery is undefined`);
    }
  }

  @Action(/details:(\d+):(\d+):(\d+)/)
  async detailsCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} detailsCommand `);
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const year = Number(parts[1]);
      const month = Number(parts[2]);
      const date = Number(parts[3]);
      await this.statisticsService.getDetailedTransactions(ctx, year, month, date);
    } else {
      this.logger.log(`user:${ctx.from.id} callbackQuery is undefined`);
    }
  }
  @Action(/NextPage:(\d+)/)
  async nextPageCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} nextPageCommand `);
    const uniqueTransactionNames = await this.statisticsService.getUniqueTransactionNames(ctx);
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const page = Number(parts[1]);
      const transactionNameButtons = actionButtonsTransactionNames(uniqueTransactionNames, ctx.session.language, page);
      await ctx.editMessageText(SELECT_CATEGORY_MESSAGE[ctx.session.language || 'ua'], transactionNameButtons);
    }
  }

  @Action('backS')
  async backS(@Ctx() ctx: IContext & WizardContext) {
    this.logger.log(`user:${ctx.from.id} backS `);
    await resetSession(ctx);
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery.message.photo) {
      await ctx.deleteMessage();
      await ctx.reply(
        WANT_STATISTICS_MESSAGE[ctx.session.language || 'ua'],
        actionButtonsStatistics(ctx.session.language),
      );
    } else {
      await ctx.editMessageText(
        WANT_STATISTICS_MESSAGE[ctx.session.language || 'ua'],
        actionButtonsStatistics(ctx.session.language),
      );
    }
  }
}
