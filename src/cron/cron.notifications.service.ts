import { Balance } from '../shemas/balance.shemas';
import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { IContext } from '../interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from '../shemas/transaction.shemas';
import { Cron } from '@nestjs/schedule';
import { CRON_NOTIFICATION } from '../constants';

@Injectable()
export class CronNotificationsService {
  private readonly logger: Logger = new Logger(CronNotificationsService.name);
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
    @InjectModel('Balance') private readonly balanceModel: Model<Balance>,
    @InjectModel('Transaction') private readonly transactionModel: Model<Transaction>,
  ) {}

  @Cron('0 12 * * *', { timeZone: 'Europe/Kiev' })
  async notificationsAll() {
    const startTime = new Date();
    this.logger.log(`Cron task started at: ${startTime}`);

    try {
      const inactiveUsers = await this.getInactiveUsers();
      for (const user of inactiveUsers) {
        await this.sendNotification(user);
        await this.updateLastActivity(user);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      this.logger.error('Error in notificationsAll', error);
    } finally {
      const endTime = new Date();
      const elapsedTime = endTime.getTime() - startTime.getTime();
      this.logger.log(`Cron task finished at: ${endTime}, elapsed time: ${elapsedTime} ms`);
    }
  }

  private async getInactiveUsers(): Promise<Balance[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 48);
    const users = await this.balanceModel.find({ lastActivity: { $lt: cutoffDate } }).exec();

    const usersWithoutLastActivity = await this.balanceModel.find({ lastActivity: { $exists: false } }).exec();

    return users.concat(usersWithoutLastActivity);
  }

  private async sendNotification(user: Balance) {
    const userId = user.userId;
    await this.bot.telegram.sendMessage(userId, CRON_NOTIFICATION, { parse_mode: 'HTML' });
    this.logger.log(`Sent notification to user ${userId}`);
  }

  private async updateLastActivity(user: Balance) {
    user.lastActivity = new Date();
    await user.save();
    this.logger.log(`Updated lastActivity for user ${user.userId}`);
  }
}
