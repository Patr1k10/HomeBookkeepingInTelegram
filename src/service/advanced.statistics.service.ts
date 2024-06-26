import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageService } from './message.service';
import { Transaction } from '../mongodb/shemas/transaction.shemas';
import { TransactionType } from '../type/enum/transactionType.enam';
import { Balance } from '../mongodb/shemas/balance.shemas';
import { GetRefDataDto } from '../dto/ref.dto';

@Injectable()
export class AdvancedStatisticsService {
  private readonly logger: Logger = new Logger(AdvancedStatisticsService.name);

  constructor(
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    @InjectModel('Balance')
    private readonly balanceModel: Model<Balance>,
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

  async getTotalTransactionsForToday(): Promise<number> {
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

  async getTotalPositiveAndNegativeTransactionVolumeForToday(): Promise<{
    totalPositiveTransactionVolume: number;
    totalNegativeTransactionVolume: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const result = await this.transactionModel
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalPositiveTransactionVolume: {
                $sum: {
                  $cond: { if: { $gte: ['$amount', 0] }, then: '$amount', else: 0 },
                },
              },
              totalNegativeTransactionVolume: {
                $sum: {
                  $cond: { if: { $lt: ['$amount', 0] }, then: '$amount', else: 0 },
                },
              },
            },
          },
        ])
        .exec();

      if (result.length === 0) {
        return { totalPositiveTransactionVolume: 0, totalNegativeTransactionVolume: 0 };
      }
      this.logger.log(result[0]);

      return result[0];
    } catch (error) {
      throw new Error(`Failed to fetch total positive and negative transaction volume for today: ${error.message}`);
    }
  }
  async getRefData(): Promise<GetRefDataDto> {
    try {
      const balanceDocuments = await this.balanceModel.find().exec();

      let undefinedCount = 0;
      const payloadCounts: { [key: string]: number } = {};

      for (const doc of balanceDocuments) {
        if (doc.startPayload === undefined || doc.startPayload === null) {
          undefinedCount++;
        } else {
          if (payloadCounts[doc.startPayload]) {
            payloadCounts[doc.startPayload]++;
          } else {
            payloadCounts[doc.startPayload] = 1;
          }
        }
      }

      const uniqueStartPayloads = Object.entries(payloadCounts).map(([payload, count]) => ({ payload, count }));

      return {
        undefinedCount,
        uniqueStartPayloads,
      };
    } catch (error) {
      throw new Error(`Failed to fetch reference data: ${error.message}`);
    }
  }
}
