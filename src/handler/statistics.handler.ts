import { Logger } from '@nestjs/common';
import { Action, Update } from 'nestjs-telegraf';
import {
  actionButtonsDays,
  actionButtonsMonths,
  actionButtonsStatistics,
  actionButtonsTransactionNames,
  actionButtonsYears,
  backStatisticButton,
} from '../battons/app.buttons';

import { TransactionType } from '../shemas/enum/transactionType.enam';
import { StatisticsService } from '../service';
import {
  PERIOD_NULL,
  SELECT_CATEGORY_MESSAGE,
  SELECT_DAY_MESSAGE,
  SELECT_MONTH_MESSAGE,
  SELECT_YEAR_MESSAGE,
  WANT_STATISTICS_MESSAGE,
} from '../constants';
import { CustomCallbackQuery, IContext } from '../interface';

@Update()
export class StatisticsHandler {
  private readonly logger: Logger = new Logger(StatisticsHandler.name);
  constructor(private readonly statisticsService: StatisticsService) {}

  @Action('statistics')
  async statisticsCommand(ctx: IContext) {
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      WANT_STATISTICS_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsStatistics(ctx.session.language || 'ua'),
    );
    this.logger.log('statistics command executed');
  }

  @Action('my_income')
  async incomeListCommand(ctx: IContext) {
    this.logger.log('my_income command executed');
    await this.statisticsService.getTransactionsByType(ctx, TransactionType.INCOME);
  }

  @Action('my_expense')
  async expenseListCommand(ctx: IContext) {
    this.logger.log('расходы command executed');
    await this.statisticsService.getTransactionsByType(ctx, TransactionType.EXPENSE);
  }
  @Action('by_category')
  async categoryListCommand(ctx: IContext) {
    const uniqueTransactionNames = await this.statisticsService.getUniqueTransactionNames(ctx);
    if (uniqueTransactionNames === null) {
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        PERIOD_NULL[ctx.session.language],
        backStatisticButton(ctx.session.language || 'ua'),
      );
      return;
    }
    const transactionNameButtons = actionButtonsTransactionNames(uniqueTransactionNames, ctx.session.language);
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      SELECT_CATEGORY_MESSAGE[ctx.session.language || 'ua'],
      transactionNameButtons,
    );
  }

  @Action(/TransactionName:(.+)/)
  async transactionNameCommand(ctx: IContext) {
    this.logger.log('transactionName command executed');
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
    this.logger.log('today command executed');
    await this.statisticsService.getFormattedTransactionsForToday(ctx);
    this.logger.log('today command executed');
  }
  @Action('on_week')
  async weekListCommand(ctx: IContext) {
    this.logger.log('week command executed');
    await this.statisticsService.getFormattedTransactionsForWeek(ctx);
    this.logger.log('week command executed');
  }
  @Action('on_month')
  async monthListCommand(ctx: IContext) {
    this.logger.log('month command executed');
    await this.statisticsService.getFormattedTransactionsForMonth(ctx);
    this.logger.log('month command executed');
  }

  @Action('select_year')
  async yearListMenuCommand(ctx: IContext) {
    this.logger.log('year menu command executed');

    const uniqueYears = await this.statisticsService.getUniqueYears(ctx.from.id);

    const yearButtons = actionButtonsYears(uniqueYears, ctx.session.language);
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      SELECT_YEAR_MESSAGE[ctx.session.language || 'ua'],
      yearButtons,
    );
  }

  @Action(/Year:(.+)/)
  async specificYearListCommand(ctx: IContext) {
    this.logger.log('specific year command executed');
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');

      ctx.session.selectedYear = Number(parts[1]);

      await this.monthListMenuCommand(ctx);
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Action('select_month')
  async monthListMenuCommand(ctx: IContext) {
    this.logger.log('month menu command executed');
    const availableMonths = await this.statisticsService.getUniqueMonths(ctx.session.selectedYear, ctx.from.id);
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      SELECT_MONTH_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsMonths(ctx.session.language, ctx.session.selectedYear, availableMonths),
    );
  }

  @Action(/selectedDate:(\d+)(?::(\d+))?/)
  async handleSelectedDate(ctx: IContext) {

    this.logger.log('selectedDate command executed');
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
        this.logger.log('Failed to parse callbackData');
      }
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }

  @Action(/Day:(\d+):(\d+):(\d+)/)
  async specificDayListCommand(ctx: IContext) {
    this.logger.log('specific Day command executed');
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
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Action(/Month:(\d+):(\d+)/)
  async specificMonthListCommand(ctx: IContext) {
    this.logger.log('specific month command executed');
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const selectedYear = Number(parts[1]);
      const selectedMonth = Number(parts[2]);
      const availableDays = await this.statisticsService.getUniqueDays(selectedYear, selectedMonth, ctx.from.id);
      ctx.session.selectedYear = selectedYear;
      ctx.session.selectedMonth = selectedMonth;

      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        SELECT_DAY_MESSAGE[ctx.session.language || 'ua'],
        actionButtonsDays(ctx.session.language, selectedYear, selectedMonth, availableDays),
      );
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }

  @Action(/details:(\d+):(\d+):(\d+)/)
  async detailsCommand(ctx: IContext) {
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const year = Number(parts[1]);
      const month = Number(parts[2]);
      const date = Number(parts[3]);

      await this.statisticsService.getDetailedTransactions(ctx, year, month, date);
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }

  @Action('backS')
  async backS(ctx: IContext) {
    delete ctx.session.selectedDate;
    delete ctx.session.selectedMonth;
    delete ctx.session.selectedYear;
    ctx.session.awaitingUserIdInput = false;
    delete ctx.session.type;
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      WANT_STATISTICS_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsStatistics(ctx.session.language),
    );
  }
}
