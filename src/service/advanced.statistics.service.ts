import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageService } from './message.service';
import { Transaction } from '../shemas/transaction.shemas';
import { TransactionType } from '../shemas/enum/transactionType.enam';

@Injectable()
export class AdvancedStatisticsService {
  private readonly logger: Logger = new Logger(AdvancedStatisticsService.name);

  constructor(
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    private readonly messageService: MessageService,
  ) {}
  async getTop10TransactionNamesByCount(userId: number): Promise<string[]> {
    try {
      const topTransactions = await this.transactionModel
        .aggregate([
          { $match: { userId } },
          { $group: { _id: '$transactionName', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .exec();

      return topTransactions.map((transaction) => transaction._id);
    } catch (error) {
      throw new Error(`Failed to fetch top 10 transaction names: ${error.message}`);
    }
  }
  async getTop10Transaction(
    userId: number,
    transactionType: TransactionType,
  ): Promise<{ amount: number; transactionName: string }[]> {
    try {
      const transactions = await this.transactionModel
        .aggregate([
          { $match: { userId, transactionType } },
          { $group: { _id: '$transactionName', totalAmount: { $sum: '$amount' } } },
          { $sort: { totalAmount: -1 } },
          { $limit: 10 },
        ])
        .exec();

      // Преобразование объектов из результата агрегации в объекты Transaction
      return transactions.map((transaction) => ({
        transactionName: transaction._id,
        amount: transaction.totalAmount,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch top 10 transactions: ${error.message}`);
    }
  }
  async getTotalTransactions(): Promise<{ today: number; week: number; month: number }> {
    try {
      const today = await this.getTotalTransactionsForToday();
      const week = await this.getTotalTransactionsForWeek();
      const month = await this.getTotalTransactionsForMonth();

      return { today, week, month };
    } catch (error) {
      throw new Error(`Failed to fetch total transactions: ${error.message}`);
    }
  }

  private async getTotalTransactionsForToday(): Promise<number> {
    try {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const totalTransactions = await this.transactionModel
        .countDocuments({
          timestamp: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .exec();

      return totalTransactions;
    } catch (error) {
      throw new Error(`Failed to fetch total transactions for today: ${error.message}`);
    }
  }

  private async getTotalTransactionsForWeek(): Promise<number> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      const totalTransactions = await this.transactionModel
        .countDocuments({
          timestamp: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .exec();

      return totalTransactions;
    } catch (error) {
      throw new Error(`Failed to fetch total transactions for the week: ${error.message}`);
    }
  }

  private async getTotalTransactionsForMonth(): Promise<number> {
    try {
      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);

      const totalTransactions = await this.transactionModel
        .countDocuments({
          timestamp: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .exec();

      return totalTransactions;
    } catch (error) {
      throw new Error(`Failed to fetch total transactions for the month: ${error.message}`);
    }
  }
  async getTop10TransactionNames(): Promise<{ name: string; count: number }[]> {
    try {
      const topTransactions = await this.transactionModel
        .aggregate([
          { $group: { _id: '$transactionName', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .exec();

      return topTransactions.map((transaction) => ({
        name: transaction._id,
        count: transaction.count,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch top 10 transaction names: ${error.message}`);
    }
  }
  async getTop10UsersWithMostTransactions(): Promise<{ userId: number; transactionCount: number }[]> {
    try {
      const topUsers = await this.transactionModel
        .aggregate([
          { $group: { _id: '$userId', transactionCount: { $sum: 1 } } },
          { $sort: { transactionCount: -1 } },
          { $limit: 10 },
        ])
        .exec();

      return topUsers.map((user) => ({
        userId: user._id,
        transactionCount: user.transactionCount,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch top 10 users with most transactions: ${error.message}`);
    }
  }
}
