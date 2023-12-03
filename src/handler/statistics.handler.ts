import { Logger } from '@nestjs/common';
import { Action, Update } from 'nestjs-telegraf';
import { CustomCallbackQuery, IContext } from '../interface/context.interface';
import {
  actionButtonsMonths,
  actionButtonsStatistics,
  actionButtonsTransactionNames,
  backStatisticButton,
} from '../battons/app.buttons';

import { TransactionType } from '../shemas/enum/transactionType.enam';
import { StatisticsService } from '../service';
import { checkAndUpdateLastBotMessage } from '../utils/botUtils';
import { PERIOD_NULL, SELECT_CATEGORY_MESSAGE, SELECT_MONTH_MESSAGE, WANT_STATISTICS_MESSAGE } from '../constants';

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
      actionButtonsMonths(ctx.session.language),
    );
  }
  @Action(/Month:(.+)/)
  async specificMonthListCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    this.logger.log('specific month command executed');
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const selectedMonth = Number(parts[1]);

      const fromDate = new Date();
      fromDate.setMonth(selectedMonth - 1);
      fromDate.setDate(1);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date();
      toDate.setMonth(selectedMonth);
      toDate.setDate(0);
      toDate.setHours(23, 59, 59, 999);

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
