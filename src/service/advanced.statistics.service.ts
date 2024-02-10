import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageService } from './message.service';
import { Transaction } from '../shemas/transaction.shemas';

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
  async getTop10Transaction(userId: number): Promise<{ amount: number; transactionName: string }[]> {
    try {
      const transactions = await this.transactionModel
        .aggregate([
          { $match: { userId } },
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
}