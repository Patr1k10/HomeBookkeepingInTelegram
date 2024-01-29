import { Balance } from '../shemas/balance.shemas';
import { Injectable, Logger } from '@nestjs/common';
import { IContext } from '../interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { backToStartButton } from '../battons';

@Injectable()
export class NotificationService {
  private readonly logger: Logger = new Logger(NotificationService.name);
  private notificationCount: number = 0;
  private elapsedTimeInSeconds: number = 0;

  constructor(
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
    @InjectModel('Balance') private readonly balanceModel: Model<Balance>,
  ) {}

  async notificationsAll(message: string): Promise<{ elapsedTime: number; notificationCount: number }> {
    const startTime = new Date();
    this.logger.log(`Cron task started at: ${startTime}`);
    try {
      const inactiveUsers = await this.getInactiveUsers();
      for (const user of inactiveUsers) {
        await this.sendNotification(user, message);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      this.logger.error('Error in notificationsAll', error);
    } finally {
      const endTime = new Date();
      this.elapsedTimeInSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
      this.logger.log(
        `Notification task finished at: ${endTime}, elapsed time: ${this.elapsedTimeInSeconds} s, sent ${this.notificationCount} notifications`,
      );
    }
    return { elapsedTime: this.elapsedTimeInSeconds, notificationCount: this.notificationCount };
  }

  private async getInactiveUsers(): Promise<Balance[]> {
    return await this.balanceModel
      .find({
        $or: [{ isBaned: { $ne: true } }, { isBaned: { $ne: true } }],
      })
      .exec();
  }

  private async sendNotification(user: Balance, message: string) {
    try {
      const userId = user.userId;
      await this.bot.telegram.sendMessage(userId, message, {
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
}
