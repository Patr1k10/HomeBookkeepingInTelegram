import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageService } from './message.service';
import { TransactionType } from '../type/enum/transactionType.enam';
import { PERIOD_E, PERIOD_NULL } from '../constants';
import { IContext, Transaction } from '../type/interface';
import { backStatisticButton } from '../battons';
import { ITransactionQuery } from '../type/interface/transaction.query.interface';
import { message } from 'telegraf/filters';

export class StatisticsService {
  private readonly logger: Logger = new Logger(StatisticsService.name);
  constructor(
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    private readonly messageService: MessageService,
  ) {}

  async getTransactionsByType(ctx: IContext, transactionType: TransactionType): Promise<string[]> {
    const groupIds = ctx.session.group;
    const userId = ctx.from.id;
    const firstTransaction = true;
    try {
      const query =
        groupIds && groupIds.length > 0 ? { userId: { $in: groupIds }, transactionType } : { userId, transactionType };

      const transactions = await this.transactionModel.find(query).exec();

      if (transactions.length > 0) {
        this.logger.log(`Retrieved ${transactions.length} transactions`);
        const message = await this.messageService.sendFormattedTransactions(ctx, transactions, null, firstTransaction);
        return message;
      } else {
        this.logger.log(`No transactions of type ${transactionType} found`);
        await ctx.editMessageText(
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
    query: ITransactionQuery,
    noTransactionsMessage: string,
    logMessage: string,
    firstTransaction?: boolean,
  ): Promise<string[]> {
    const userId = ctx.from.id;
    const groupIds = ctx.session.group;
    ctx.session.transactionQuery = query;

    const adaptedQuery =
      groupIds && groupIds.length > 0 ? { userId: { $in: groupIds }, ...query } : { userId, ...query };

    try {
      const transactions = await this.transactionModel.find(adaptedQuery).exec();
      if (transactions.length > 0) {
        this.logger.log(
          logMessage.replace('{count}', transactions.length.toString()).replace('{userId}', userId.toString()),
        );
        const message = await this.messageService.sendFormattedTransactions(ctx, transactions, query, firstTransaction);
        return message;
      } else {
        this.logger.log(noTransactionsMessage.replace('{userId}', userId.toString()));
        const messageError = [];
        messageError.push(noTransactionsMessage);
        return messageError;
      }
    } catch (error) {
      this.logger.error('Error getting transactions', error);
      throw error;
    }
  }
  async getTransactionsForChard(ctx: IContext, query: ITransactionQuery): Promise<Transaction[]> {
    const userId = ctx.from.id;
    const groupIds = ctx.session.group;
    ctx.session.transactionQuery = query;

    const adaptedQuery =
      groupIds && groupIds.length > 0 ? { userId: { $in: groupIds }, ...query } : { userId, ...query };

    return await this.transactionModel.find(adaptedQuery).exec();
  }

  async getTransactionsByTransactionName(ctx: IContext, transactionName: string): Promise<string[]> {
    const message = await this.getTransactions(
      ctx,
      { transactionName } as ITransactionQuery,
      `${PERIOD_NULL[ctx.session.language]}(${transactionName})⛔️`,
      `Retrieved {count} transactions by name for user {userId}`,
      true,
    );
    return message;
  }

  async getFormattedTransactionsForToday(ctx: IContext): Promise<string[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const message = await this.getTransactions(
      ctx,
      { timestamp: { $gte: today } } as ITransactionQuery,
      PERIOD_E[ctx.session.language],
      `Retrieved {count} transactions for today for user {userId}`,
    );
    return message;
  }

  async getFormattedTransactionsForWeek(ctx: IContext): Promise<string[]> {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    const message = await this.getTransactions(
      ctx,
      { timestamp: { $gte: weekAgo, $lte: today } } as ITransactionQuery,
      PERIOD_E[ctx.session.language],
      `Retrieved {count} transactions for the week for user {userId}`,
    );
    return message;
  }

  async getFormattedTransactionsForMonth(ctx: IContext): Promise<string[]> {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);
    const message = await this.getTransactions(
      ctx,
      { timestamp: { $gte: monthAgo, $lte: today } } as ITransactionQuery,
      PERIOD_E[ctx.session.language],
      `Retrieved {count} transactions for the month for user {userId}`,
    );
    return message;
  }
  async getTransactionsByPeriod(ctx: IContext, fromDate: Date, toDate: Date): Promise<string[]> {
    const message = await this.getTransactions(
      ctx,
      { timestamp: { $gte: fromDate, $lte: toDate } } as ITransactionQuery,
      PERIOD_E[ctx.session.language],
      `Retrieved {count} transactions for the period for user {userId}`,
    );
    return message;
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
  async getUniqueYears(userId: number, groupIds?: number[]): Promise<number[]> {
    try {
      const query = groupIds && groupIds.length > 0 ? { userId: { $in: [...groupIds, userId] } } : { userId };

      const allDates = await this.transactionModel.find(query, 'timestamp').exec();

      return Array.from(new Set(allDates.map((date) => new Date(date.timestamp).getFullYear())));
    } catch (error) {
      this.logger.error('Error getting unique years', error);
      throw error;
    }
  }
  async getUniqueMonths(selectedYear: number, userId: number, groupIds?: number[]): Promise<number[]> {
    try {
      const query = groupIds && groupIds.length > 0 ? { userId: { $in: [...groupIds, userId] } } : { userId };

      const transactions = await this.transactionModel
        .find({
          ...query,
          timestamp: { $ne: null, $type: 'date' },
        })
        .select('timestamp')
        .lean();

      const uniqueMonths = new Set<number>();

      transactions.forEach((transaction) => {
        const timestamp =
          transaction.timestamp instanceof Date ? transaction.timestamp : new Date(transaction.timestamp);
        if (!isNaN(timestamp.valueOf()) && timestamp.getFullYear() === selectedYear) {
          const month = timestamp.getMonth() + 1;
          uniqueMonths.add(month);
        }
      });

      return Array.from(uniqueMonths);
    } catch (error) {
      console.error('Error in getUniqueMonths:', error);
      throw error;
    }
  }
  async getUniqueDays(
    selectedYear: number,
    selectedMonth: number,
    userId: number,
    groupIds?: number[],
  ): Promise<number[]> {
    try {
      const query = groupIds && groupIds.length > 0 ? { userId: { $in: [...groupIds, userId] } } : { userId };

      const transactions = await this.transactionModel
        .find({
          ...query,
          timestamp: { $ne: null, $type: 'date' },
        })
        .select('timestamp')
        .lean();

      const uniqueDays = new Set<number>();

      transactions.forEach((transaction) => {
        const timestamp =
          transaction.timestamp instanceof Date ? transaction.timestamp : new Date(transaction.timestamp);
        if (
          !isNaN(timestamp.valueOf()) &&
          timestamp.getFullYear() === selectedYear &&
          timestamp.getMonth() + 1 === selectedMonth
        ) {
          const day = timestamp.getDate();
          uniqueDays.add(day);
        }
      });

      return Array.from(uniqueDays);
    } catch (error) {
      console.error('Error in getUniqueDays:', error);
      throw error;
    }
  }
  async getDetailedTransactions(ctx: IContext, year: number, month: number, date: number): Promise<void> {
    const userId = ctx.from.id;
    const groupIds = ctx.session.group;
    const fromDate = new Date(year, month - 1, date, 0, 0, 0, 0);
    const toDate = new Date(year, month - 1, date, 23, 59, 59, 999);

    try {
      const query = groupIds && groupIds.length > 0 ? { userId: { $in: [...groupIds, userId] } } : { userId };

      const transactions = await this.transactionModel
        .find({
          ...query,
          timestamp: { $gte: fromDate, $lte: toDate },
        })
        .exec();

      if (transactions.length > 0) {
        const formattedTransactions = await Promise.all(
          transactions.map(async (transaction) => await this.messageService.formatTransaction(transaction)),
        );
        const mark = backStatisticButton(ctx.session.language || 'ua');
        const detailedStatistics = formattedTransactions.join('\n');

        await ctx.editMessageText(detailedStatistics, { parse_mode: 'HTML', reply_markup: mark.reply_markup });
      } else {
        await ctx.reply('Детальна статистика відсутня.');
      }
    } catch (error) {
      this.logger.error('Error getting detailed transactions', error);
      throw error;
    }
  }
}
