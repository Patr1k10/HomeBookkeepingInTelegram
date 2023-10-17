import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBalanceDto } from '../dto/balance.dto';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { IContext } from '../interface/context.interface';
import { Balance } from '../shemas/balance.shemas';
import { TransactionType } from '../shemas/enum/transactionType.enam';

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

      await balance.save();
      this.logger.log(`Updated balance for user ${userId}`);
    } catch (error) {
      this.logger.error('Error updating balance', error);
      throw error;
    }
  }
  async deleteAllBalancesOfUser(userId: number): Promise<void> {
    try {
      await this.balanceModel.deleteMany({ userId }).exec();
      this.logger.log(`Deleted all balances for user ${userId}`);
    } catch (error) {
      this.logger.error('Error deleting all balances for user', error);
      throw error;
    }
  }
  async getBalance(userId: number, groupIds?: number[]): Promise<number> {
    let balance = 0;

    if (groupIds && groupIds.length > 0) {
      // Поиск и суммирование балансов по groupIds
      const balances = await this.balanceModel.find({ userId: { $in: groupIds } }).exec();
      balance = balances.reduce((acc, curr) => acc + curr.balance, 0);
    } else {
      // Поиск баланса по userId
      const userBalance = await this.balanceModel.findOne({ userId }).exec();
      if (userBalance) {
        balance = userBalance.balance;
      }
    }

    return balance;
  }
}
