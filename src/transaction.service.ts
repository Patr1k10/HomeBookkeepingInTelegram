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
  async getTransactionsByType(userId: number, transactionType: TransactionType): Promise<void> {
    try {
      const transactions = await this.transactionModel.find({ userId, transactionType }).exec();
      if (transactions.length > 0) {
        this.logger.log(`Retrieved ${transactions.length} transactions for user ${userId}`);
        await this.sendFormattedTransactions(userId, transactions);
      } else {
        this.logger.log(`No transactions of type ${transactionType} found for user ${userId}`);
        await this.bot.telegram.sendMessage(userId, `⛔️Нет транзакций данного типа (${transactionType})⛔️`);
      }
    } catch (error) {
      this.logger.error('Error getting transactions by type', error);
      throw error;
    }
  }
  async getTransactions(userId: number, query: any, noTransactionsMessage: string, logMessage: string): Promise<void> {
    try {
      const transactions = await this.transactionModel.find(query).exec();
      if (transactions.length > 0) {
        this.logger.log(
          logMessage.replace('{count}', transactions.length.toString()).replace('{userId}', userId.toString()),
        );
        await this.sendFormattedTransactions(userId, transactions);
      } else {
        this.logger.log(noTransactionsMessage.replace('{userId}', userId.toString()));
        await this.bot.telegram.sendMessage(userId, noTransactionsMessage);
      }
    } catch (error) {
      this.logger.error('Error getting transactions', error);
      throw error;
    }
  }

  async getTransactionsByTransactionName(userId: number, transactionName: string): Promise<void> {
    await this.getTransactions(
      userId,
      { userId, transactionName },
      `⛔️Нет транзакций с именем (${transactionName})⛔️`,
      `Retrieved {count} transactions by name for user {userId}`,
    );
  }

  async getFormattedTransactionsForToday(userId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.getTransactions(
      userId,
      { userId, timestamp: { $gte: today } },
      '⛔️Нет транзакций на сегодня⛔️',
      `Retrieved {count} transactions for today for user {userId}`,
    );
  }

  async getFormattedTransactionsForWeek(userId: number): Promise<void> {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    await this.getTransactions(
      userId,
      { userId, timestamp: { $gte: weekAgo, $lte: today } },
      '⛔️Нет транзакций за последнюю неделю⛔️',
      `Retrieved {count} transactions for the week for user {userId}`,
    );
  }

  async getFormattedTransactionsForMonth(userId: number): Promise<void> {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);
    await this.getTransactions(
      userId,
      { userId, timestamp: { $gte: monthAgo, $lte: today } },
      '⛔️Нет транзакций за последний месяц⛔️',
      `Retrieved {count} transactions for the month for user {userId}`,
    );
  }
  async getTransactionsByPeriod(userId: number, fromDate: Date, toDate: Date): Promise<void> {
    const query = { userId, timestamp: { $gte: fromDate, $lte: toDate } };
    const transactions = await this.transactionModel.find(query).exec();

    if (transactions.length > 0) {
      this.logger.log(`Retrieved ${transactions.length} transactions for the period for user ${userId}`);
      await this.sendFormattedTransactions(userId, transactions);
    } else {
      this.logger.log(`No transactions found for the period for user ${userId}`);
      await this.bot.telegram.sendMessage(userId, '⛔️Нет транзакций за данный период⛔️');
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

  async showLastNTransactionsWithDeleteOption(userId: number, count: number): Promise<void> {
    try {
      const transactions = await this.transactionModel.find({ userId }).sort({ timestamp: -1 }).limit(count).exec();

      if (transactions.length === 0) {
        await this.bot.telegram.sendMessage(userId, '⛔️Нет доступных транзакций для удаления.⛔️');
        return;
      }

      const buttons = transactions.map((transaction) => [
        {
          text: `${transaction.transactionName} : ${transaction.amount} грн.`,
          callback_data: `delete_${transaction._id}`,
        },
      ]);

      await this.bot.telegram.sendMessage(userId, 'Выберите транзакции для удаления🗑️:', {
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
        await this.bot.telegram.sendMessage(userId, '⛔️Транзакция не найдена⛔️');
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
      await this.bot.telegram.sendMessage(userId, 'Транзакция удалена');
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
📝 <b>${transactionName}</b>: ${amount} грн.
`;
  }
  splitArray(array: any[], chunkSize: number): any[][] {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }
  private async sendFormattedTransactions(userId: number, transactions: Transaction[]): Promise<void> {
    let totalAmount = 0;
    transactions.forEach((transaction) => (totalAmount += transaction.amount));
    const transactionGroups = this.splitArray(transactions, 5);
    for (let i = 0; i < transactionGroups.length; ++i) {
      const group = transactionGroups[i];
      const formattedTransactions = group.map(this.formatTransaction);
      let message = formattedTransactions.join('\n');

      if (i === transactionGroups.length - 1) {
        message += `\n---------------------------------------\n<b>Всего:</b> ${totalAmount} грн.`;
      }
      await this.bot.telegram.sendMessage(userId, message, { parse_mode: 'HTML' });
    }
  }
}
