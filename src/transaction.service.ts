import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Balance, TransactionType } from './mongodb/shemas';
import { CreateTransactionDto } from './dto/balance.dto';
import { Transaction } from './interface/transaction.interface';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { Context } from './interface/context.interfsce';
import { BalanceService } from './balance.service';
import { DELETE_LAST_MESSAGE, DELETE_LAST_MESSAGE2, PERIOD_E, TOTAL_MESSAGES } from './constants/messages';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel('Balance') private readonly balanceModel: Model<Balance>,
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    private readonly logger: Logger,
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly balanceService: BalanceService,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    try {
      // ...
      const transactionType = createTransactionDto.transactionType;
      let amount = createTransactionDto.amount;
      if (transactionType === TransactionType.EXPENSE) {
        amount *= -1;
      }
      const transaction = new this.transactionModel({
        userId: createTransactionDto.userId,
        transactionName: createTransactionDto.transactionName,
        transactionType,
        amount,
      });
      const createdTransaction = await transaction.save();
      this.logger.log(`Created transaction for user ${createTransactionDto.userId}`);
      return createdTransaction;
    } catch (error) {
      this.logger.error('Error creating transaction', error);
      throw error;
    }
  }
  async getTransactionsByType(userId: number, transactionType: TransactionType, language: string): Promise<void> {
    try {
      const transactions = await this.transactionModel.find({ userId, transactionType }).exec();
      if (transactions.length > 0) {
        this.logger.log(`Retrieved ${transactions.length} transactions for user ${userId}`);
        await this.sendFormattedTransactions(userId, transactions, language);
      } else {
        this.logger.log(`No transactions of type ${transactionType} found for user ${userId}`);
        await this.bot.telegram.sendMessage(userId, `⛔️Немає транзакцій даного типу (${transactionType})⛔️`);
      }
    } catch (error) {
      this.logger.error('Error getting transactions by type', error);
      throw error;
    }
  }
  async getTransactions(
    userId: number,
    query: any,
    noTransactionsMessage: string,
    logMessage: string,
    language: string,
  ): Promise<void> {
    try {
      const transactions = await this.transactionModel.find(query).exec();
      if (transactions.length > 0) {
        this.logger.log(
          logMessage.replace('{count}', transactions.length.toString()).replace('{userId}', userId.toString()),
        );
        await this.sendFormattedTransactions(userId, transactions, language);
      } else {
        this.logger.log(noTransactionsMessage.replace('{userId}', userId.toString()));
        await this.bot.telegram.sendMessage(userId, noTransactionsMessage);
      }
    } catch (error) {
      this.logger.error('Error getting transactions', error);
      throw error;
    }
  }

  async getTransactionsByTransactionName(userId: number, transactionName: string, language: string): Promise<void> {
    await this.getTransactions(
      userId,
      { userId, transactionName },
      `⛔️Немає транзакцій з ім'ям (${transactionName})⛔️`,
      `Retrieved {count} transactions by name for user {userId}`,
      language,
    );
  }

  async getFormattedTransactionsForToday(userId: number, language: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.getTransactions(
      userId,
      { userId, timestamp: { $gte: today } },
      PERIOD_E[language],
      `Retrieved {count} transactions for today for user {userId}`,
      language,
    );
  }

  async getFormattedTransactionsForWeek(userId: number, language: string): Promise<void> {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    await this.getTransactions(
      userId,
      { userId, timestamp: { $gte: weekAgo, $lte: today } },
      PERIOD_E[language],
      `Retrieved {count} transactions for the week for user {userId}`,
      language,
    );
  }

  async getFormattedTransactionsForMonth(userId: number, language: string): Promise<void> {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);
    await this.getTransactions(
      userId,
      { userId, timestamp: { $gte: monthAgo, $lte: today } },
      PERIOD_E[language],
      `Retrieved {count} transactions for the month for user {userId}`,
      language,
    );
  }
  async getTransactionsByPeriod(userId: number, fromDate: Date, toDate: Date, language: string): Promise<void> {
    const query = { userId, timestamp: { $gte: fromDate, $lte: toDate } };
    const transactions = await this.transactionModel.find(query).exec();

    if (transactions.length > 0) {
      this.logger.log(`Retrieved ${transactions.length} transactions for the period for user ${userId}`);
      await this.sendFormattedTransactions(userId, transactions, language);
    } else {
      this.logger.log(`No transactions found for the period for user ${userId}`);
      await this.bot.telegram.sendMessage(userId, PERIOD_E[language]);
    }
  }
  async getUniqueTransactionNames(userId: number): Promise<string[]> {
    try {
      return await this.transactionModel.distinct('transactionName', { userId }).exec();
    } catch (error) {
      this.logger.error('Error getting unique transaction names', error);
      throw error;
    }
  }

  async showLastNTransactionsWithDeleteOption(userId: number, count: number, language: string): Promise<void> {
    try {
      const transactions = await this.transactionModel.find({ userId }).sort({ timestamp: -1 }).limit(count).exec();

      if (transactions.length === 0) {
        await this.bot.telegram.sendMessage(userId, DELETE_LAST_MESSAGE2[language]);
        return;
      }

      const buttons = transactions.map((transaction) => [
        {
          text: `${transaction.transactionName} : ${transaction.amount}`,
          callback_data: `delete_${transaction._id}`,
        },
      ]);

      await this.bot.telegram.sendMessage(userId, DELETE_LAST_MESSAGE[language], {
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    } catch (error) {
      this.logger.error('Error in showLastNTransactionsWithDeleteOption', error);
      throw error;
    }
  }

  async deleteTransactionById(userId: number, transactionId: string): Promise<void> {
    try {
      const transaction = await this.transactionModel.findOne({ _id: transactionId, userId }).exec();

      if (!transaction) {
        this.logger.log(`Transaction not found for ID: ${transactionId}`);
        await this.bot.telegram.sendMessage(userId, '⛔️Транзакція не знайдена⛔️');
        return;
      }
      const balance = await this.balanceService.getOrCreateBalance(userId);

      if (transaction.transactionType === TransactionType.INCOME) {
        balance.balance -= transaction.amount;
      } else if (transaction.transactionType === TransactionType.EXPENSE) {
        balance.balance += Math.abs(transaction.amount);
      }

      await balance.save();
      await this.transactionModel.deleteOne({ _id: transactionId }).exec();

      this.logger.log(`Deleted transaction with ID: ${transactionId}`);
      await this.bot.telegram.sendMessage(userId, 'Транзакція видалена');
    } catch (error) {
      this.logger.error(`Error in deleteTransactionById: ${error}`);
      throw error;
    }
  }

  formatTransaction(transaction: Transaction): string {
    const transactionName = transaction.transactionName;

    const amount = transaction.amount;
    const timestamp = new Date(transaction.timestamp).toLocaleString('ru-RU', {
      timeZone: 'Europe/Kiev',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    return `📆 ${timestamp}
📝 <b>${transactionName}</b>: ${amount}
`;
  }
  splitArray(array: any[], chunkSize: number): any[][] {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }
  async sendFormattedTransactions(userId: number, transactions: Transaction[], language: string): Promise<void> {
    let totalPositiveAmount = 0;
    let totalNegativeAmount = 0;
    const positiveTransactionSums: { [key: string]: number } = {};
    const negativeTransactionSums: { [key: string]: number } = {};

    transactions.forEach((transaction) => {
      if (transaction.amount > 0) {
        totalPositiveAmount += transaction.amount;
        if (positiveTransactionSums[transaction.transactionName]) {
          positiveTransactionSums[transaction.transactionName] += transaction.amount;
        } else {
          positiveTransactionSums[transaction.transactionName] = transaction.amount;
        }
      } else {
        totalNegativeAmount += Math.abs(transaction.amount);
        if (negativeTransactionSums[transaction.transactionName]) {
          negativeTransactionSums[transaction.transactionName] += Math.abs(transaction.amount);
        } else {
          negativeTransactionSums[transaction.transactionName] = Math.abs(transaction.amount);
        }
      }
    });

    const transactionGroups = this.splitArray(transactions, 5);

    for (let i = 0; i < transactionGroups.length; ++i) {
      const group = transactionGroups[i];
      const formattedTransactions = group.map(this.formatTransaction);
      let message = formattedTransactions.join('\n');

      if (i === transactionGroups.length - 1) {
        const localizedMessage = this.getLocalizedMessage('TOTAL_AMOUNT', language);

        message += `${localizedMessage}${totalPositiveAmount - totalNegativeAmount}.\n`;

        if (Object.keys(positiveTransactionSums).length > 0) {
          const localizedMessage = this.getLocalizedMessage('POSITIVE_TRANSACTIONS', language);
          message += localizedMessage;
          for (const [name, sum] of Object.entries(positiveTransactionSums)) {
            const percentage = ((sum / totalPositiveAmount) * 100).toFixed(2);
            message += this.formatMessage(name, percentage, sum);
          }
        }

        if (Object.keys(negativeTransactionSums).length > 0) {
          const localizedMessage = this.getLocalizedMessage('NEGATIVE_TRANSACTIONS', language);
          message += localizedMessage;
          for (const [name, sum] of Object.entries(negativeTransactionSums)) {
            const percentage = ((sum / totalNegativeAmount) * 100).toFixed(2);
            message += this.formatMessage(name, percentage, sum);
          }
        }
      }

      await this.bot.telegram.sendMessage(userId, message, { parse_mode: 'HTML' });
    }
  }

  formatMessage(name: string, percentage: string, sum: number): string {
    const paddedName = name.padEnd(12, ' ');
    return `<code>${paddedName}: ${percentage}% (${sum})</code>\n`;
  }
  getLocalizedMessage(key: string, language: string) {
    return TOTAL_MESSAGES[key][language] || TOTAL_MESSAGES[key]['ua'];
  }
}
