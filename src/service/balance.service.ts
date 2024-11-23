import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Balance } from '../mongodb/shemas/balance.shemas';
import { TransactionType } from '../type/enum/transactionType.enam';

@Injectable()
export class BalanceService {
  private readonly logger: Logger = new Logger(BalanceService.name);

  constructor(@InjectModel('Balance') private readonly balanceModel: Model<Balance>) {}

  async getOrCreateBalance(userId: number): Promise<Balance> {
    let balance = await this.balanceModel.findOne({ userId }).exec();
    if (!balance) {
      balance = new this.balanceModel({ userId, balance: 0 });
      await balance.save();
      this.logger.log(`Created new balance for user ${userId}`);
    }
    return balance;
  }

  async createBalance(userId: number): Promise<Balance> {
    try {
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

      balance.lastActivity = new Date();
      await balance.save();
      this.logger.log(`Updated balance for user ${userId}`);
    } catch (error) {
      this.logger.error('Error updating balance', error);
      throw error;
    }
  }

  async setBalance(userId: number, amount: number): Promise<void> {
    try {
      const balance = await this.getOrCreateBalance(userId);
      balance.balance = amount;
      balance.lastActivity = new Date();
      await balance.save();
      this.logger.log(`Set balance for user ${userId}`);
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
      const balances = await this.balanceModel.find({ userId: { $in: groupIds } }).exec();
      balance = balances.reduce((acc, curr) => acc + curr.balance, 0);
    } else {
      const userBalance = await this.balanceModel.findOne({ userId }).exec();
      if (userBalance) {
        balance = userBalance.balance;
        userBalance.lastActivity = new Date();
        await userBalance.save();
      }
    }
    return balance;
  }

  async countAllBalances(): Promise<number> {
    try {
      const count = await this.balanceModel.countDocuments().exec();
      this.logger.log(`Total number of balances in the database: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('Error counting all balances', error);
      throw error;
    }
  }

  async countBannedUsers(): Promise<number> {
    try {
      const bannedUsersCount = await this.balanceModel
        .countDocuments({
          isBaned: true,
        })
        .exec();

      this.logger.log(`Number of banned users: ${bannedUsersCount}`);
      return bannedUsersCount;
    } catch (error) {
      this.logger.error('Error counting banned users', error);
      throw error;
    }
  }

  async countActiveUsersLast3Days(): Promise<number> {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // Date 3 days ago

      const activeUsersCount = await this.balanceModel
        .countDocuments({
          lastActivity: { $gte: threeDaysAgo },
        })
        .exec();

      this.logger.log(`Number of active users in the last 3 days: ${activeUsersCount}`);
      return activeUsersCount;
    } catch (error) {
      this.logger.error('Error counting active users in the last 3 days', error);
      throw error;
    }
  }
  async setStartPayload(userId: number, userStartPayload: string) {
    if (!userStartPayload.split(' ')[1]) {
      return;
    } else {
      const user = await this.balanceModel.findOne({ userId }).exec();
      const startPayload = userStartPayload.split(' ')[1];
      user.startPayload = startPayload;
      await user.save();
    }
  }
}
