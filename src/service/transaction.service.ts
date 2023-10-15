import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from '../interface/transaction.interface';
import { InjectBot } from 'nestjs-telegraf';
import { IContext } from '../interface/context.interface';
import { BalanceService } from './balance.service';
import { Telegraf } from 'telegraf';
import { TransactionType } from '../shemas/enum/transactionType.enam';
import { CreateTransactionDto } from '../dto/transaction.dto';
import { DELETE_LAST_MESSAGE, DELETE_LAST_MESSAGE2 } from '../constants/messages';

@Injectable()
export class TransactionService {
  private readonly logger: Logger = new Logger(TransactionService.name);
  constructor(
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    @InjectBot() private readonly bot: Telegraf<IContext>,
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
    } catch (error) {
      this.logger.error(`Error in deleteTransactionById: ${error}`);
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
  async deleteAllTransactionsOfUser(userId: number): Promise<void> {
    try {
      await this.transactionModel.deleteMany({ userId }).exec();
      this.logger.log(`Deleted all transactions for user ${userId}`);
    } catch (error) {
      this.logger.error('Error deleting all transactions for user', error);
      throw error;
    }
  }
}
