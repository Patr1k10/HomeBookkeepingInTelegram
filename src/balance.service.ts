import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Balance, TransactionType } from './mongodb/shemas';
import { CreateBalanceDto } from './dto/balance.dto';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { IContext } from './interface/context.interface';

@Injectable()
export class BalanceService {
  private readonly logger: Logger = new Logger(BalanceService.name);
  constructor(
    @InjectModel('Balance') private readonly balanceModel: Model<Balance>,
    @InjectModel('Transaction')
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
  ) {}
  async getOrCreateBalance(userId: number): Promise<Balance> {
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

  async updateBalance(userId: number, amount: number, transactionType: TransactionType): Promise<void> {
    try {
      const balance = await this.getOrCreateBalance(userId);

      if (transactionType === TransactionType.INCOME) {
        balance.balance += amount;
      } else if (transactionType === TransactionType.EXPENSE) {
        balance.balance -= amount;
      }
      this.logger.log(`Updated balance for user ${userId}`);

      await balance.save();
      this.logger.log(`Updated balance for user ${userId}`);
    } catch (error) {
      this.logger.error('Error updating balance', error);
      throw error;
    }
  }
}
