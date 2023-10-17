import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from '../interface/transaction.interface';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { IContext } from '../interface/context.interface';
import { MessageService } from './message.service';
import { TransactionType } from '../shemas/enum/transactionType.enam';
import { PERIOD_E } from '../constants/messages';

export class StatisticsService {
  private readonly logger: Logger = new Logger(StatisticsService.name);
  constructor(
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    @InjectBot() private readonly bot: Telegraf<IContext>,
    private readonly messageService: MessageService,
  ) {}

  async getTransactionsByType(
    userId: number,
    groupIds: number[],
    transactionType: TransactionType,
    language: string,
    currency: string,
  ): Promise<void> {
    try {
      const query =
        groupIds && groupIds.length > 0 ? { userId: { $in: groupIds }, transactionType } : { userId, transactionType };

      const transactions = await this.transactionModel.find(query).exec();

      if (transactions.length > 0) {
        this.logger.log(`Retrieved ${transactions.length} transactions`);
        await this.messageService.sendFormattedTransactions(userId, transactions, language, currency);
      } else {
        this.logger.log(`No transactions of type ${transactionType} found`);
        await this.bot.telegram.sendMessage(userId, `⛔️Немає транзакцій даного типу (${transactionType})⛔️`);
      }
    } catch (error) {
      this.logger.error('Error getting transactions by type', error);
      throw error;
    }
  }

  async getTransactions(
    userId: number,
    groupIds: number[],
    query: any,
    noTransactionsMessage: string,
    logMessage: string,
    language: string,
    currency: string,
  ): Promise<void> {
    const adaptedQuery = groupIds.length > 0 ? { userId: { $in: groupIds }, ...query } : { userId, ...query };

    try {
      const transactions = await this.transactionModel.find(adaptedQuery).exec();
      if (transactions.length > 0) {
        this.logger.log(
          logMessage.replace('{count}', transactions.length.toString()).replace('{userId}', userId.toString()),
        );
        await this.messageService.sendFormattedTransactions(userId, transactions, language, currency);
      } else {
        this.logger.log(noTransactionsMessage.replace('{userId}', userId.toString()));
        await this.bot.telegram.sendMessage(userId, noTransactionsMessage);
      }
    } catch (error) {
      this.logger.error('Error getting transactions', error);
      throw error;
    }
  }

  async getTransactionsByTransactionName(
    userId: number,
    groupIds: number[],
    transactionName: string,
    language: string,
    currency: string,
  ): Promise<void> {
    await this.getTransactions(
      userId,
      groupIds,
      { transactionName },
      `⛔️Немає транзакцій з ім'ям (${transactionName})⛔️`,
      `Retrieved {count} transactions by name for user {userId}`,
      language,
      currency,
    );
  }

  async getFormattedTransactionsForToday(
    userId: number,
    groupIds: number[],
    language: string,
    currency: string,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.getTransactions(
      userId,
      groupIds,
      { timestamp: { $gte: today } },
      PERIOD_E[language],
      `Retrieved {count} transactions for today for user {userId}`,
      language,
      currency,
    );
  }

  async getFormattedTransactionsForWeek(
    userId: number,
    groupIds: number[],
    language: string,
    currency: string,
  ): Promise<void> {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    await this.getTransactions(
      userId,
      groupIds,
      { timestamp: { $gte: weekAgo, $lte: today } },
      PERIOD_E[language],
      `Retrieved {count} transactions for the week for user {userId}`,
      language,
      currency,
    );
  }

  async getFormattedTransactionsForMonth(
    userId: number,
    groupIds: number[],
    language: string,
    currency: string,
  ): Promise<void> {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);
    await this.getTransactions(
      userId,
      groupIds,
      { timestamp: { $gte: monthAgo, $lte: today } },
      PERIOD_E[language],
      `Retrieved {count} transactions for the month for user {userId}`,
      language,
      currency,
    );
  }
  async getTransactionsByPeriod(
    userId: number,
    groupIds: number[],
    fromDate: Date,
    toDate: Date,
    language: string,
    currency: string,
  ): Promise<void> {
    await this.getTransactions(
      userId,
      groupIds,
      { timestamp: { $gte: fromDate, $lte: toDate } },
      `⛔️Немає транзакцій за період⛔️`,
      `Retrieved {count} transactions for the period for user {userId}`,
      language,
      currency,
    );
  }

  async getUniqueTransactionNames(userId: number, groupIds: number[]): Promise<string[] | null> {
    try {
      const query = groupIds.length > 0 ? { userId: { $in: groupIds } } : { userId };
      const result = await this.transactionModel.distinct('transactionName', query).exec();
      return result.length > 0 ? result : null;
    } catch (error) {
      this.logger.error('Error getting unique transaction names', error);
      throw error;
    }
  }
}
