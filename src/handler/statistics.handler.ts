import { Logger } from '@nestjs/common';
import { Action, Command, Hears, Update } from 'nestjs-telegraf';
import { CustomCallbackQuery, IContext } from '../interface/context.interface';
import { actionButtonsMonths, actionButtonsStatistics, actionButtonsTransactionNames } from '../battons/app.buttons';
import {
  ERROR_MESSAGE,
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

  @Command('statistics')
  @Hears(/Статистика 📊|Statistics 📊/)
  async statisticsCommand(ctx: IContext) {
    try {
      await ctx.deleteMessage();
      const sentMessage = await ctx.reply(
        WANT_STATISTICS_MESSAGE[ctx.session.language || 'ua'],
        actionButtonsStatistics(ctx.session.language),
      );
      ctx.session.lastBotMessage = sentMessage.message_id;

      this.logger.log('statistics command executed');
    } catch (error) {
      this.logger.error('Error in statisticsCommand:', error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }

  @Action('Мои приходы')
  async incomeListCommand(ctx: IContext) {
    this.logger.log('приходы command executed');
    const userId = ctx.from.id;
    await this.statisticsService.getTransactionsByType(
      userId,
      ctx.session.group,
      TransactionType.INCOME,
      ctx.session.language || 'ua',
      ctx.session.currency || 'UAH',
    );
  }

  @Action('Мои расходы')
  async expenseListCommand(ctx: IContext) {
    this.logger.log('расходы command executed');
    const userId = ctx.from.id;
    await this.statisticsService.getTransactionsByType(
      userId,
      ctx.session.group,
      TransactionType.EXPENSE,
      ctx.session.language || 'ua',
      ctx.session.currency || 'UAH',
    );
  }
  @Action('По категории')
  async categoryListCommand(ctx: IContext) {
    const userId = ctx.from.id;
    const uniqueTransactionNames = await this.statisticsService.getUniqueTransactionNames(userId, ctx.session.group);
    if (uniqueTransactionNames === null) {
      await ctx.reply(PERIOD_NULL[ctx.session.language]);
      return;
    }
    const transactionNameButtons = actionButtonsTransactionNames(uniqueTransactionNames);
    await ctx.reply(SELECT_CATEGORY_MESSAGE[ctx.session.language || 'ua'], transactionNameButtons);
  }

  @Action(/TransactionName:(.+)/)
  async transactionNameCommand(ctx: IContext) {
    this.logger.log('transactionName command executed');
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const selectedTransactionName = parts[1];
      const userId = ctx.from.id;
      await this.statisticsService.getTransactionsByTransactionName(
        userId,
        ctx.session.group,
        selectedTransactionName,
        ctx.session.language || 'ua',
        ctx.session.currency || 'UAH',
      );
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Action('За сегодня')
  async todayListCommand(ctx: IContext) {
    this.logger.log('today command executed');
    const userId = ctx.from.id;
    await this.statisticsService.getFormattedTransactionsForToday(
      userId,
      ctx.session.group,
      ctx.session.language || 'ua',
      ctx.session.currency || 'UAH',
    );
    this.logger.log('today command executed');
  }
  @Action('За неделю')
  async weekListCommand(ctx: IContext) {
    this.logger.log('week command executed');
    const userId = ctx.from.id;
    await this.statisticsService.getFormattedTransactionsForWeek(
      userId,
      ctx.session.group,
      ctx.session.language || 'ua',
      ctx.session.currency || 'UAH',
    );
    this.logger.log('week command executed');
  }
  @Action('За месяц')
  async monthListCommand(ctx: IContext) {
    this.logger.log('month command executed');
    const userId = ctx.from.id;
    await this.statisticsService.getFormattedTransactionsForMonth(
      userId,
      ctx.session.group,
      ctx.session.language || 'ua',
      ctx.session.currency || 'UAH',
    );
    this.logger.log('month command executed');
  }
  @Action('Выбрать месяц')
  async monthListMenuCommand(ctx: IContext) {
    this.logger.log('month menu command executed');
    await ctx.reply(SELECT_MONTH_MESSAGE[ctx.session.language || 'ua'], actionButtonsMonths(ctx.session.language));
  }
  @Action(/Month:(.+)/)
  async specificMonthListCommand(ctx: IContext) {
    this.logger.log('specific month command executed');
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const selectedMonth = Number(parts[1]);
      const userId = ctx.from.id;

      const fromDate = new Date();
      fromDate.setMonth(selectedMonth - 1);
      fromDate.setDate(1);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date();
      toDate.setMonth(selectedMonth);
      toDate.setDate(0);
      toDate.setHours(23, 59, 59, 999);

      await this.statisticsService.getTransactionsByPeriod(
        userId,
        ctx.session.group,
        fromDate,
        toDate,
        ctx.session.language || 'ua',
        ctx.session.currency || 'UAH',
      );
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
}
