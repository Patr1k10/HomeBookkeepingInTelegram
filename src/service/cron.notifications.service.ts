import { Balance } from '../shemas/balance.shemas';
import { Injectable, Logger } from '@nestjs/common';
import { IContext } from '../interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { CRON_NOTIFICATION } from '../constants';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { backToStartButton } from '../battons';

@Injectable()
export class CronNotificationsService {
  private readonly logger: Logger = new Logger(CronNotificationsService.name);
  private notificationCount: number = 0;
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
    @InjectModel('Balance') private readonly balanceModel: Model<Balance>,
  ) {}

  @Cron('47 17 * * *', { timeZone: 'Europe/Kiev' })
  async notificationsAll() {
    const startTime = new Date();
    this.logger.log(`Cron task started at: ${startTime}`);

    try {
      const inactiveUsers = await this.getInactiveUsers();
      for (const user of inactiveUsers) {
        await this.sendNotification(user);
        await this.updateLastActivity(user);
        await this.deductPremiumFromBalance(user);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      this.logger.error('Error in notificationsAll', error);
    } finally {
      const endTime = new Date();
      const elapsedTime = endTime.getTime() - startTime.getTime();
      this.logger.log(
        `Cron task finished at: ${endTime}, elapsed time: ${elapsedTime} ms, sent ${this.notificationCount} notifications`,
      );
    }
  }

  private async getInactiveUsers(): Promise<Balance[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 72); // to everyone who is not active
    return await this.balanceModel
      .find({
        $or: [
          { lastActivity: { $lt: cutoffDate }, isBaned: { $ne: true } },
          { lastActivity: { $exists: false }, isBaned: { $ne: true } },
        ],
      })
      .exec();
  }

  private async sendNotification(user: Balance) {
    try {
      const userId = user.userId;
      await this.bot.telegram.sendMessage(userId, CRON_NOTIFICATION, {
        parse_mode: 'HTML',
        reply_markup: backToStartButton().reply_markup,
      });
      this.logger.log(`Sent notification to user ${userId}`);
      this.notificationCount++;
    } catch (error) {
      if (error.code === 403) {
        await this.markUserAsBanned(user);
      }
      this.logger.error(`Error sending notification to user ${user.userId}`, error);
    }
  }

  private async markUserAsBanned(user: Balance) {
    try {
      user.isBaned = true;
      await user.save();
      this.logger.log(`Marked user ${user.userId} as banned`);
    } catch (error) {
      this.logger.error(`Error marking user ${user.userId} as banned`, error);
    }
  }

  private async updateLastActivity(user: Balance) {
    try {
      if (user.isBaned) {
        this.logger.log(`User ${user.userId} is banned. Skipping lastActivity update.`);
        return;
      }
      user.lastActivity = new Date();
      await user.save();
      this.logger.log(`Updated lastActivity for user ${user.userId}`);
    } catch (error) {
      this.logger.error(`Error updating lastActivity for user ${user.userId}`, error);
    }
  }

  private async deductPremiumFromBalance(user: Balance) {
    try {
      if (user.dayOfPremium <= new Date()) {
        user.isPremium = false;

        await user.save();
        this.logger.log(`Deducted premium from balance for user ${user.userId}`);
      } else return;
    } catch (error) {
      this.logger.error(`Error deducting premium from balance for user ${user.userId}`, error);
    }
  }
}
