import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Balance } from '../shemas/balance.shemas';

@Injectable()
export class PremiumService {
  private readonly logger: Logger = new Logger(PremiumService.name);

  constructor(@InjectModel('Balance') private readonly balanceModel: Model<Balance>) {}

  async setIsPremium(userId: number, days: number): Promise<boolean> {
    const balance = await this.balanceModel.findOne({ userId }).exec();
    if (balance.dayOfPremium > new Date()) {
      this.logger.log(`User:${userId} Premium already active.`);
      return false;
    } else {
      balance.isPremium = true;
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + days);
      balance.dayOfPremium = currentDate;
      this.logger.log(`User:${userId} Set is premium for ${days} days`);
      await balance.save();
      return true;
    }
  }

  async getIsPremium(userId: number): Promise<boolean> {
    const balance = await this.balanceModel.findOne({ userId }).exec();
    if (!balance.isPremium) {
      balance.isPremium;
      await balance.save();
      return balance.isPremium;
    }
    return balance.isPremium;
  }

  async getRemainingPremiumDays(userId: number): Promise<number> {
    const balance = await this.balanceModel.findOne({ userId }).exec();
    if (balance && balance.dayOfPremium) {
      const currentDate = new Date();
      const premiumEndDate = new Date(balance.dayOfPremium);
      const timeDifference = premiumEndDate.getTime() - currentDate.getTime();
      return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    } else {
      return 0;
    }
  }

  async deductPremiumFromUser(userId: number) {
    try {
      const user = await this.balanceModel.findOne({ userId });
      if (user.isPremium === false) {
        return;
      }
      if (user.dayOfPremium <= new Date()) {
        user.isPremium = false;
        await user.save();
        this.logger.log(`Deducted premium from balance for user ${user.userId}`);
      }
      if (user.dayOfPremium >= new Date()) {
        user.isPremium = true;
        await user.save();
      }
    } catch (error) {
      this.logger.error(`Error deducting premium from balance for user ${userId}`, error);
    }
  }

  async countPremiumUsers(): Promise<number> {
    try {
      const premiumUsersCount = await this.balanceModel
        .countDocuments({
          isPremium: true,
        })
        .exec();

      this.logger.log(`Number of premium users: ${premiumUsersCount}`);
      return premiumUsersCount;
    } catch (error) {
      this.logger.error('Error counting premium users', error);
      throw error;
    }
  }
}
