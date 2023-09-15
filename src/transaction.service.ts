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
  ) {}

  async createBalance(createBalanceDto: CreateBalanceDto): Promise<Balance> {
    try {
      const balance = new this.balanceModel(createBalanceDto);
      const createdBalance = await balance.save();
      this.logger.log(`Created balance for user ${createBalanceDto.userId}`);
      return createdBalance;
    } catch (error) {
      this.logger.error('Error creating balance', error);
      throw error;
    }
  }

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    try {
      const transaction = new this.transactionModel(createTransactionDto);
      const createdTransaction = await transaction.save();
      this.logger.log(
        `Created transaction for user ${createTransactionDto.userId}`,
      );
      return createdTransaction;
    } catch (error) {
      this.logger.error('Error creating transaction', error);
      throw error;
    }
  }

  async getBalance(userId: number): Promise<Balance | null> {
    try {
      const balance = await this.balanceModel.findOne({ userId }).exec();
      if (balance) {
        this.logger.log(`Retrieved balance for user ${userId}`);
      } else {
        this.logger.log(`No balance found for user ${userId}`);
      }
      return balance;
    } catch (error) {
      this.logger.error('Error getting balance', error);
      throw error;
    }
  }

  async getTransactions(userId: number): Promise<void> {
    try {
      const transactions = await this.transactionModel.find({ userId }).exec();
      const formattedTransactions: string[] = [];

      if (transactions.length > 0) {
        this.logger.log(
          `Retrieved ${transactions.length} transactions for user ${userId}`,
        );
        for (const transaction of transactions) {
          const formattedTransaction = this.formatTransaction(transaction);
          formattedTransactions.push(formattedTransaction);
        }
        await this.bot.telegram.sendMessage(
          userId,
          formattedTransactions.join('\n'),
        );
      } else {
        this.logger.log(`No transactions found for user ${userId}`);
        await this.bot.telegram.sendMessage(
          userId,
          'Нет транзакций для отображения',
        );
      }
    } catch (error) {
      this.logger.error('Error getting transactions', error);
      throw error;
    }
  }

  async deleteBalance(userId: number): Promise<void> {
    try {
      const result = await this.balanceModel
        .findOneAndRemove({ userId })
        .exec();
      if (result) {
        this.logger.log(`Deleted balance for user ${userId}`);
        await this.bot.telegram.sendMessage(
          userId,
          'Баланс пользователя удален',
        );
      } else {
        this.logger.log(`No balance found for user ${userId}`);
        await this.bot.telegram.sendMessage(
          userId,
          'Баланс пользователя не найден',
        );
      }
    } catch (error) {
      this.logger.error('Error deleting balance', error);
      throw error;
    }
  }

  async updateBalance(
    userId: number,
    amount: number,
    transactionType: TransactionType,
  ): Promise<void> {
    try {
      const balance = await this.balanceModel.findOne({ userId });
      if (!balance) {
        const newBalance = new this.balanceModel({
          userId,
          balance: 0,
          transactions: [],
        });
        await newBalance.save();
        this.logger.log(`Created new balance for user ${userId}`);
        await this.bot.telegram.sendMessage(
          userId,
          'Создан новый баланс для пользователя',
        );
      } else {
        if (transactionType === TransactionType.INCOME) {
          balance.balance += amount;
        } else if (transactionType === TransactionType.EXPENSE) {
          balance.balance -= amount;
        }
        await balance.save();
        this.logger.log(`Updated balance for user ${userId}`);
        await this.bot.telegram.sendMessage(
          userId,
          'Баланс пользователя обновлен',
        );
      }
    } catch (error) {
      this.logger.error('Error updating balance', error);
      throw error;
    }
  }

  async getTransactionsByType(
    userId: number,
    transactionType: TransactionType,
  ): Promise<void> {
    try {
      const transactions = await this.transactionModel
        .find({ userId, transactionType })
        .exec();
      const formattedTransactions: string[] = [];
      for (const transaction of transactions) {
        const formattedTransaction = this.formatTransaction(transaction);
        formattedTransactions.push(formattedTransaction);
      }
      if (formattedTransactions.length > 0) {
        await this.bot.telegram.sendMessage(
          userId,
          formattedTransactions.join('\n'),
        );
      } else {
        await this.bot.telegram.sendMessage(
          userId,
          'Нет транзакций данного типа',
        );
      }
    } catch (error) {
      this.logger.error('Error getting transactions by type', error);
      throw error;
    }
  }

  async getTransactionsByTransactionName(
    userId: number,
    transactionName: string,
  ): Promise<void> {
    try {
      const transactions = await this.transactionModel
        .find({ userId, transactionName })
        .exec();
      const formattedTransactions: string[] = [];
      for (const transaction of transactions) {
        const formattedTransaction = this.formatTransaction(transaction);
        formattedTransactions.push(formattedTransaction);
      }
      if (formattedTransactions.length > 0) {
        await this.bot.telegram.sendMessage(
          userId,
          formattedTransactions.join('\n'),
        );
      } else {
        await this.bot.telegram.sendMessage(
          userId,
          'Нет транзакций с таким названием',
        );
      }
    } catch (error) {
      this.logger.error('Error getting transactions by transactionName', error);
      throw error;
    }
  }

  async getFormattedTransactionsForToday(userId: number): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Установите время начала дня
      const transactions = await this.transactionModel
        .find({
          userId,
          timestamp: { $gte: today },
        })
        .exec();

      if (!transactions || transactions.length === 0) {
        await this.bot.telegram.sendMessage(
          userId,
          'Нет транзакций на сегодня',
        );
      } else {
        const formattedTransactions: string[] = [];
        for (const transaction of transactions) {
          const formattedTransaction = this.formatTransaction(transaction);
          formattedTransactions.push(formattedTransaction);
        }
        await this.bot.telegram.sendMessage(
          userId,
          formattedTransactions.join('\n'),
        );
      }
    } catch (error) {
      this.logger.error(
        'Произошла ошибка при получении транзакций на сегодня',
        error,
      );
      await this.bot.telegram.sendMessage(
        userId,
        'Произошла ошибка при получении транзакций на сегодня',
      );
    }
  }

  async getFormattedTransactionsForWeek(userId: number): Promise<void> {
    try {
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      const transactions = await this.transactionModel
        .find({
          userId,
          timestamp: { $gte: weekAgo, $lte: today },
        })
        .exec();
      const formattedTransactions: string[] = [];
      for (const transaction of transactions) {
        const formattedTransaction = this.formatTransaction(transaction);
        formattedTransactions.push(formattedTransaction);
      }
      if (formattedTransactions.length > 0) {
        await this.bot.telegram.sendMessage(
          userId,
          formattedTransactions.join('\n'),
        );
      } else {
        await this.bot.telegram.sendMessage(
          userId,
          'Нет транзакций за последнюю неделю',
        );
      }
    } catch (error) {
      this.logger.error('Error getting transactions for week', error);
      await this.bot.telegram.sendMessage(
        userId,
        'Произошла ошибка при получении транзакций за последнюю неделю',
      );
    }
  }

  async getFormattedTransactionsForMonth(userId: number): Promise<void> {
    try {
      const today = new Date();
      const monthAgo = new Date();
      monthAgo.setDate(today.getDate() - 30);
      const transactions = await this.transactionModel
        .find({
          userId,
          timestamp: { $gte: monthAgo, $lte: today },
        })
        .exec();
      const formattedTransactions: string[] = [];
      for (const transaction of transactions) {
        const formattedTransaction = this.formatTransaction(transaction);
        formattedTransactions.push(formattedTransaction);
      }
      if (formattedTransactions.length > 0) {
        await this.bot.telegram.sendMessage(
          userId,
          formattedTransactions.join('\n'),
        );
      } else {
        await this.bot.telegram.sendMessage(
          userId,
          'Нет транзакций за последний месяц',
        );
      }
    } catch (error) {
      this.logger.error('Error getting transactions for month', error);
      await this.bot.telegram.sendMessage(
        userId,
        'Произошла ошибка при получении транзакций за последний месяц',
      );
    }
  }

  private formatTransaction(transaction: Transaction): string {
    const transactionName = transaction.transactionName;
    const transactionType = transaction.transactionType;
    const amount = transaction.amount;
    const timestamp = new Date(transaction.timestamp).toLocaleString('ru-RU', {
      timeZone: 'Europe/Kiev',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    return `
Время: ${timestamp}
Название: ${transactionName}
Тип: ${transactionType}
Сумма: ${amount}`;
  }
}
