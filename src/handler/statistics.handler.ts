import { Logger } from '@nestjs/common';
import { Action, Update } from 'nestjs-telegraf';
import {
  actionButtonsMonths,
  actionButtonsStatistics,
  actionButtonsTransactionNames,
  actionButtonsYears,
  backStatisticButton,
} from '../battons/app.buttons';

import { TransactionType } from '../shemas/enum/transactionType.enam';
import { StatisticsService } from '../service';
import { checkAndUpdateLastBotMessage } from '../utils/botUtils';
import {
  PERIOD_NULL,
  SELECT_CATEGORY_MESSAGE,
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
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    this.logger.log('my_income command executed');
    await this.statisticsService.getTransactionsByType(ctx, TransactionType.INCOME);
  }

  @Action('my_expense')
  async expenseListCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    this.logger.log('расходы command executed');
    await this.statisticsService.getTransactionsByType(ctx, TransactionType.EXPENSE);
  }
  @Action('by_category')
  async categoryListCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    this.logger.log('today command executed');
    await this.statisticsService.getFormattedTransactionsForToday(ctx);
    this.logger.log('today command executed');
  }
  @Action('on_week')
  async weekListCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    this.logger.log('week command executed');
    await this.statisticsService.getFormattedTransactionsForWeek(ctx);
    this.logger.log('week command executed');
  }
  @Action('on_month')
  async monthListCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    this.logger.log('month command executed');
    await this.statisticsService.getFormattedTransactionsForMonth(ctx);
    this.logger.log('month command executed');
  }

  @Action('select_year')
  async yearListMenuCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    this.logger.log('month menu command executed');
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      SELECT_MONTH_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsMonths(ctx.session.language, ctx.session.selectedYear),
    );
  }
  @Action(/Month:(\d+):(\d+)/)
  async specificMonthListCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    this.logger.log('specific month command executed');
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const selectedYear = Number(parts[1]);
      const selectedMonth = Number(parts[2]);

      const fromDate = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
      const toDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

      await this.statisticsService.getTransactionsByPeriod(ctx, fromDate, toDate);
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Action('backS')
  async backS(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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
