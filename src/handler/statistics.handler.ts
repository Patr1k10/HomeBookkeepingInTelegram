import { Logger } from '@nestjs/common';
import { Action, Update } from 'nestjs-telegraf';
import { CustomCallbackQuery, IContext } from '../interface/context.interface';
import { actionButtonsMonths, actionButtonsStatistics, actionButtonsTransactionNames } from '../battons/app.buttons';
import {
  PERIOD_NULL,
  SELECT_CATEGORY_MESSAGE,
  SELECT_MONTH_MESSAGE,
  WANT_STATISTICS_MESSAGE,
} from '../constants/messages';
import { TransactionType } from '../shemas/enum/transactionType.enam';
import { StatisticsService } from '../service';

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
        actionButtonsStatistics(ctx.session.language || 'ua'),
      );
      return;
    }
    const transactionNameButtons = actionButtonsTransactionNames(uniqueTransactionNames);
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
  @Action('За неделю')
  async weekListCommand(ctx: IContext) {
    this.logger.log('week command executed');
    await this.statisticsService.getFormattedTransactionsForWeek(ctx);
    this.logger.log('week command executed');
  }
  @Action('За месяц')
  async monthListCommand(ctx: IContext) {
    this.logger.log('month command executed');
    await this.statisticsService.getFormattedTransactionsForMonth(ctx);
    this.logger.log('month command executed');
  }
  @Action('Выбрать месяц')
  async monthListMenuCommand(ctx: IContext) {
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
    await ctx.telegram.editMessageReplyMarkup(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      actionButtonsStatistics(ctx.session.language).reply_markup,
    );
  }
}
