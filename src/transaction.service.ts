import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Balance, TransactionType } from './mongodb/shemas';
import { PinoLoggerService } from './loger/pino.loger.service';
import { CreateBalanceDto, CreateTransactionDto } from './dto/balance.dto';
import { Transaction } from './interface/transaction.interface';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { Context } from './interface/context.interfsce';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel('Balance') private readonly balanceModel: Model<Balance>,
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    private readonly logger: PinoLoggerService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {
    this.logger.setContext('TransactionService');
  }
  private async getOrCreateBalance(userId: number): Promise<Balance> {
    let balance = await this.balanceModel.findOne({ userId }).exec();
    if (!balance) {
      balance = new this.balanceModel({ userId, balance: 0 });
      await balance.save();
      this.logger.log(`Created new balance for user ${userId}`);
    }
    return balance;
  }

  async createBalance(createBalanceDto: CreateBalanceDto): Promise<Balance> {
    try {
      const userId = createBalanceDto.userId;
      const existingBalance = await this.getOrCreateBalance(userId);
      if (existingBalance) {
        this.logger.log(`Balance already exists for user ${userId}`);
      }
      return existingBalance;
    } catch (error) {
      this.logger.error('Error creating balance', error);
      throw error;
    }
  }

  async getBalance(userId: number): Promise<void> {
    try {
      const balance = await this.getOrCreateBalance(userId);
      const message = `Ваш баланс: ${balance.balance} грн`;
      await this.bot.telegram.sendMessage(userId, message);
      this.logger.log(`Retrieved balance for user ${userId}`);
    } catch (error) {
      this.logger.error('Error getting balance', error);
      throw error;
    }
  }
  async updateBalance(userId: number, amount: number, transactionType: TransactionType): Promise<void> {
    try {
      const balance = await this.getOrCreateBalance(userId);

      if (transactionType === TransactionType.INCOME) {
        balance.balance += amount;
      } else if (transactionType === TransactionType.EXPENSE) {
        balance.balance -= amount;
      }

      await balance.save();
      this.logger.log(`Updated balance for user ${userId}`);
      await this.bot.telegram.sendMessage(userId, 'Баланс пользователя обновлен');
    } catch (error) {
      this.logger.error('Error updating balance', error);
      throw error;
    }
  }

  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    try {
      // ...
      const transactionType = createTransactionDto.transactionType;
      let amount = createTransactionDto.amount;
      if (transactionType === TransactionType.EXPENSE) {
        // Если это расход, умножьте сумму на -1
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
        await this.sendFormattedTransactions(userId, transactions); // Использование нового метода
      } else {
        this.logger.log(`No transactions of type ${transactionType} found for user ${userId}`);
        await this.bot.telegram.sendMessage(userId, `Нет транзакций данного типа (${transactionType})`);
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
      `Нет транзакций с именем (${transactionName})`,
      `Retrieved {count} transactions by name for user {userId}`,
    );
  }

  async getFormattedTransactionsForToday(userId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.getTransactions(
      userId,
      { userId, timestamp: { $gte: today } },
      'Нет транзакций на сегодня',
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
      'Нет транзакций за последнюю неделю',
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
      'Нет транзакций за последний месяц',
      `Retrieved {count} transactions for the month for user {userId}`,
    );
  }

  async getUniqueTransactionNames(userId: number): Promise<string[]> {
    try {
      return await this.transactionModel.distinct('transactionName', { userId }).exec();
    } catch (error) {
      this.logger.error('Error getting unique transaction names', error);
      throw error;
    }
  }
  formatTransaction(transaction: Transaction): string {
    const transactionName = transaction.transactionName;
    const transactionType = transaction.transactionType;
    const amount = transaction.amount;
    const timestamp = new Date(transaction.timestamp).toLocaleString('ru-RU', {
      timeZone: 'Europe/Kiev',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    const formattedTransaction = `
    ---------------------------------------
    ${timestamp}
    ${transactionName}

    ${transactionType}
    ${amount} грн.
  `;
    return formattedTransaction.trim();
  }
  splitArray(array: any[], chunkSize: number): any[][] {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }
  // Добавленный метод для отправки форматированных транзакций
  private async sendFormattedTransactions(userId: number, transactions: Transaction[]): Promise<void> {
    let totalAmount = 0;
    transactions.forEach((transaction) => (totalAmount += transaction.amount));
    const transactionGroups = this.splitArray(transactions, 5);
    for (let i = 0; i < transactionGroups.length; ++i) {
      const group = transactionGroups[i];
      const formattedTransactions = group.map(this.formatTransaction);
      let message = formattedTransactions.join('\n');

      if (i === transactionGroups.length - 1) {
        message += `\n---------------------------------------\nВсего: ${totalAmount} грн`;
      }
      await this.bot.telegram.sendMessage(userId, message);
    }
  }

  // Добавленный метод для управления балансом
}
