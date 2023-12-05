import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from '../interface/transaction.interface';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { IContext } from '../interface/context.interface';
import { MessageService } from './message.service';
import { TransactionType } from '../shemas/enum/transactionType.enam';
import { PERIOD_E, PERIOD_NULL } from '../constants/messages';
import { backStatisticButton } from '../battons/app.buttons';

export class StatisticsService {
  private readonly logger: Logger = new Logger(StatisticsService.name);
  constructor(
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    @InjectBot() private readonly bot: Telegraf<IContext>,
    private readonly messageService: MessageService,
  ) {}

  async getTransactionsByType(ctx: IContext, transactionType: TransactionType): Promise<void> {
    const groupIds = ctx.session.group;
    const userId = ctx.from.id;
    try {
      const query =
        groupIds && groupIds.length > 0 ? { userId: { $in: groupIds }, transactionType } : { userId, transactionType };

      const transactions = await this.transactionModel.find(query).exec();

      if (transactions.length > 0) {
        this.logger.log(`Retrieved ${transactions.length} transactions`);
        await this.messageService.sendFormattedTransactions(ctx, transactions);
      } else {
        this.logger.log(`No transactions of type ${transactionType} found`);
        await this.bot.telegram.editMessageText(
          userId,
          ctx.session.lastBotMessage,
          null,
          `${PERIOD_NULL[ctx.session.language]} (${transactionType})⛔️`,
          backStatisticButton(ctx.session.language || 'ua'),
        );
      }
    } catch (error) {
      this.logger.error('Error getting transactions by type', error);
      throw error;
    }
  }

  private async getTransactions(
    ctx: IContext,
    query: any,
    noTransactionsMessage: string,
    logMessage: string,
  ): Promise<void> {
    const userId = ctx.from.id;
    const groupIds = ctx.session.group;

    const adaptedQuery =
      groupIds && groupIds.length > 0 ? { userId: { $in: groupIds }, ...query } : { userId, ...query };

    try {
      const transactions = await this.transactionModel.find(adaptedQuery).exec();
      if (transactions.length > 0) {
        this.logger.log(
          logMessage.replace('{count}', transactions.length.toString()).replace('{userId}', userId.toString()),
        );
        await this.messageService.sendFormattedTransactions(ctx, transactions);
      } else {
        this.logger.log(noTransactionsMessage.replace('{userId}', userId.toString()));
        await this.bot.telegram.editMessageText(
          userId,
          ctx.session.lastBotMessage,
          null,
          noTransactionsMessage,
          backStatisticButton(ctx.session.language || 'ua'),
        );
      }
    } catch (error) {
      this.logger.error('Error getting transactions', error);
      throw error;
    }
  }

  async getTransactionsByTransactionName(ctx: IContext, transactionName: string): Promise<void> {
    await this.getTransactions(
      ctx,
      { transactionName },
      `${PERIOD_NULL[ctx.session.language]}(${transactionName})⛔️`,
      `Retrieved {count} transactions by name for user {userId}`,
    );
  }

  async getFormattedTransactionsForToday(ctx: IContext): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.getTransactions(
      ctx,
      { timestamp: { $gte: today } },
      PERIOD_E[ctx.session.language],
      `Retrieved {count} transactions for today for user {userId}`,
    );
  }

  async getFormattedTransactionsForWeek(ctx: IContext): Promise<void> {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    await this.getTransactions(
      ctx,
      { timestamp: { $gte: weekAgo, $lte: today } },
      PERIOD_E[ctx.session.language],
      `Retrieved {count} transactions for the week for user {userId}`,
    );
  }

  async getFormattedTransactionsForMonth(ctx: IContext): Promise<void> {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);
    await this.getTransactions(
      ctx,
      { timestamp: { $gte: monthAgo, $lte: today } },
      PERIOD_E[ctx.session.language],
      `Retrieved {count} transactions for the month for user {userId}`,
    );
  }
  async getTransactionsByPeriod(ctx: IContext, fromDate: Date, toDate: Date): Promise<void> {
    await this.getTransactions(
      ctx,
      { timestamp: { $gte: fromDate, $lte: toDate } },
      PERIOD_E[ctx.session.language],
      `Retrieved {count} transactions for the period for user {userId}`,
    );
  }

  async getUniqueTransactionNames(ctx: IContext): Promise<string[] | null> {
    const groupIds = ctx.session.group;
    const userId = ctx.from.id;
    try {
      const query = groupIds && groupIds.length > 0 ? { userId: { $in: groupIds } } : { userId };

      const result = await this.transactionModel.distinct('transactionName', query).exec();
      return result.length > 0 ? result : null;
    } catch (error) {
      this.logger.error('Error getting unique transaction names', error);
      throw error;
    }
  }
  async getUniqueYears(userId: number): Promise<number[]> {
    try {
      const allDates = await this.transactionModel.find({ userId }, 'timestamp').exec();

      return Array.from(new Set(allDates.map((date) => new Date(date.timestamp).getFullYear())));
    } catch (error) {
      this.logger.error('Error getting unique years', error);
      throw error;
    }
  }
}
