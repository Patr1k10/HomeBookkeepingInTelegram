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
      const userId = createBalanceDto.userId;
      const existingBalance = await this.balanceModel.findOne({ userId }).exec();
      if (existingBalance) {
        this.logger.log(`Balance already exists for user ${userId}`);
        return existingBalance;
      } else {
        const balance = new this.balanceModel({
          userId,
          balance: 0, // Устанавливаем начальный баланс равным 0
          transactions: [],
        });

        const createdBalance = await balance.save();
        this.logger.log(`Created balance for user ${userId}`);
        return createdBalance;
      }
    } catch (error) {
      this.logger.error('Error creating balance', error);
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

  async getBalance(userId: number): Promise<void> {
    try {
      const balance = await this.balanceModel.findOne({ userId }).exec();
      if (balance) {
        const message = `Ваш баланс: ${balance.balance} грн`;
        await this.bot.telegram.sendMessage(userId, message);

        this.logger.log(`Retrieved balance for user ${userId}`);
      } else {
        await this.createBalance({ userId });
        this.logger.log(`No balance found for user ${userId}`);
      }
    } catch (error) {
      this.logger.error('Error getting balance', error);
      throw error;
    }
  }



  async updateBalance(userId: number, amount: number, transactionType: TransactionType): Promise<void> {
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
        await this.bot.telegram.sendMessage(userId, 'Создан новый баланс для пользователя');
      } else {
        if (transactionType === TransactionType.INCOME) {
          balance.balance += amount;
        } else if (transactionType === TransactionType.EXPENSE) {
          // Если это расход, учитываем знак минус
          balance.balance -= amount;
        }
        await balance.save();
        this.logger.log(`Updated balance for user ${userId}`);
        await this.bot.telegram.sendMessage(userId, 'Баланс пользователя обновлен');
      }
    } catch (error) {
      this.logger.error('Error updating balance', error);
      throw error;
    }
  }

  async getTransactionsByType(userId: number, transactionType: TransactionType): Promise<void> {
    try {
      const transactions = await this.transactionModel.find({ userId, transactionType }).exec();
      if (transactions.length > 0) {
        this.logger.log(`Retrieved ${transactions.length} transactions for user ${userId}`);
        for (const transaction of transactions) {
          const formattedTransaction = this.formatTransaction(transaction);
          await this.bot.telegram.sendMessage(userId, formattedTransaction);
        }
      } else {
        this.logger.log(`No transactions of type ${transactionType} found for user ${userId}`);
        await this.bot.telegram.sendMessage(userId, `Нет транзакций данного типа (${transactionType})`);
      }
    } catch (error) {
      this.logger.error('Error getting transactions by type', error);
      throw error;
    }
  }

  async getTransactionsByTransactionName(userId: number, transactionName: string): Promise<void> {
    try {
      const transactions = await this.transactionModel.find({ userId, transactionName }).exec();
      if (transactions.length > 0) {
        this.logger.log(`Retrieved ${transactions.length} transactions by name for user ${userId}`);
        for (const transaction of transactions) {
          const formattedTransaction = this.formatTransaction(transaction);
          await this.bot.telegram.sendMessage(userId, formattedTransaction);
        }
      } else {
        this.logger.log(`No transactions with name ${transactionName} found for user ${userId}`);
        await this.bot.telegram.sendMessage(userId, `Нет транзакций с именем (${transactionName})`);
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
        await this.bot.telegram.sendMessage(userId, 'Нет транзакций на сегодня');
      } else {
        for (const transaction of transactions) {
          const formattedTransaction = this.formatTransaction(transaction);
          await this.bot.telegram.sendMessage(userId, formattedTransaction);
        }
      }
    } catch (error) {
      this.logger.error('Произошла ошибка при получении транзакций на сегодня', error);
      await this.bot.telegram.sendMessage(userId, 'Произошла ошибка при получении транзакций на сегодня');
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
      if (transactions.length > 0) {
        for (const transaction of transactions) {
          const formattedTransaction = this.formatTransaction(transaction);
          await this.bot.telegram.sendMessage(userId, formattedTransaction);
        }
      } else {
        await this.bot.telegram.sendMessage(userId, 'Нет транзакций за последнюю неделю');
      }
    } catch (error) {
      this.logger.error('Error getting transactions for week', error);
      await this.bot.telegram.sendMessage(userId, 'Произошла ошибка при получении транзакций за последнюю неделю');
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
      if (transactions.length > 0) {
        for (const transaction of transactions) {
          const formattedTransaction = this.formatTransaction(transaction);
          await this.bot.telegram.sendMessage(userId, formattedTransaction);
        }
      } else {
        await this.bot.telegram.sendMessage(userId, 'Нет транзакций за последний месяц');
      }
    } catch (error) {
      this.logger.error('Error getting transactions for month', error);
      await this.bot.telegram.sendMessage(userId, 'Произошла ошибка при получении транзакций за последний месяц');
    }
  }

  async getUniqueTransactionNames(userId: number): Promise<string[]> {
    try {
      const uniqueTransactionNames = await this.transactionModel.distinct('transactionName', { userId }).exec();
      return uniqueTransactionNames;
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

    // Создайте форматированную строку с двумя колонками
    const formattedTransaction = `
    ---------------------------------------
    ${timestamp}
    ${transactionName}

    ${transactionType}
    ${amount} грн.
  `;

    // Удалите лишние отступы и пробелы
    return formattedTransaction.trim();
  }
}
