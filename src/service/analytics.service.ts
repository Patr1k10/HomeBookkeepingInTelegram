import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Analytics } from '../mongodb/shemas/analytics.schemas';
import { BalanceService } from './balance.service';
import { PremiumService } from './premium.service';
import { AdvancedStatisticsService } from './advanced.statistics.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AnalyticsService {
  private readonly logger: Logger = new Logger(AnalyticsService.name);
  constructor(
    @InjectModel('Analytics') private readonly analyticsModel: Model<Analytics>,
    private readonly balanceService: BalanceService,
    private readonly premiumService: PremiumService,
    private readonly advancedStatisticsService: AdvancedStatisticsService,
  ) {}
  @Cron('59 23 * * *', { timeZone: 'Europe/Kiev' })
  async createAnalytics() {
    const allUserCount = await this.balanceService.countAllBalances();
    const activeUsersCount = await this.balanceService.countActiveUsersLast3Days();
    const premiumUsersCount = await this.premiumService.countPremiumUsers();
    const bannedUsersCount = await this.balanceService.countBannedUsers();
    const totalTransactionsCount = await this.advancedStatisticsService.getTotalTransactionsForToday();
    const { totalPositiveTransactionVolume, totalNegativeTransactionVolume } =
      await this.advancedStatisticsService.getTotalPositiveAndNegativeTransactionVolumeForToday();
    this.logger.log({ totalPositiveTransactionVolume, totalNegativeTransactionVolume });
    const analytics = new this.analyticsModel({
      allUserCount,
      activeUsersCount,
      bannedUsersCount,
      premiumUsersCount,
      totalTransactionsCount,
      totalPositiveTransactionVolume,
      totalNegativeTransactionVolume,
    });

    const createAnalytics = await analytics.save();
    this.logger.log(`Analytics saved to ${createAnalytics.day}`);
  }

  private async getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]> {
    // const startOfDay = new Date(startDate);
    // startOfDay.setUTCHours(0, 0, 0, 0);
    //
    // const endOfDay = new Date(endDate);
    // endOfDay.setUTCHours(23, 59, 59, 999);

    console.log(`startDate: ${startDate} endDate: ${endDate}`);

    const startDateAnalytics = await this.analyticsModel
      .findOne({
        day: {
          $gte: new Date(startDate).setUTCHours(0, 0, 0, 0),
          $lte: new Date(startDate).setUTCHours(23, 59, 59, 999),
        },
      })
      .exec();

    const endDateAnalytics = await this.analyticsModel
      .findOne({
        day: {
          $gte: new Date(endDate).setUTCHours(0, 0, 0, 0),
          $lte: new Date(endDate).setUTCHours(23, 59, 59, 999),
        },
      })
      .exec();

    const analyticsData = [];
    if (startDateAnalytics) {
      analyticsData.push(startDateAnalytics);
    }
    if (endDateAnalytics) {
      analyticsData.push(endDateAnalytics);
    }

    console.log(analyticsData);

    return analyticsData;
  }

  async generateReport(startDate: Date, endDate: Date, period: string): Promise<string> {
    const analyticsData = await this.getAnalyticsByDateRange(startDate, endDate);

    if (analyticsData.length === 0) {
      return 'Нет данных за указанный период.';
    }

    const current = analyticsData[0];
    let allUserCountChangeSum = 0;
    let activeUsersCountChangeSum = 0;
    let premiumUsersCountChangeSum = 0;
    let bannedUsersCountChangeSum = 0;
    let totalTransactionsCountChangeSum = 0;

    for (let i = 1; i < analyticsData.length; i++) {
      const previous = analyticsData[i];

      allUserCountChangeSum += current.allUserCount - previous.allUserCount;
      activeUsersCountChangeSum += current.activeUsersCount - previous.activeUsersCount;
      premiumUsersCountChangeSum += current.premiumUsersCount - previous.premiumUsersCount;
      bannedUsersCountChangeSum += current.bannedUsersCount - previous.bannedUsersCount;
      totalTransactionsCountChangeSum += current.totalTransactionsCount - previous.totalTransactionsCount;
    }

    const count = analyticsData.length - 1;

    const nextDay = new Date(current.day);
    nextDay.setDate(nextDay.getDate() + 1);
    const formattedDate = nextDay.toISOString().split('T')[0];

    let periodDescription = '';

    switch (period) {
      case 'for_today':
        periodDescription = `За день`;
        break;
      case 'for_week':
        periodDescription = `За тиждень`;
        break;
      case 'for_month':
        periodDescription = `за мисяць`;
        break;
      case 'for_3_month':
        periodDescription = `за три місяці`;
        break;
    }

    const report = `
    📊 Отчет:
    📅 Період: ${periodDescription}
    👥 Всего пользователей: ${current.allUserCount} (${this.formatChange(allUserCountChangeSum / count)})
    🔥 Активные пользователи: ${current.activeUsersCount} (${this.formatChange(activeUsersCountChangeSum / count)})
    💎 Премиум пользователи: ${current.premiumUsersCount} (${this.formatChange(premiumUsersCountChangeSum / count)})
    🚫 Заблокированные пользователи: ${current.bannedUsersCount} (${this.formatChange(
      bannedUsersCountChangeSum / count,
    )})
    💸 Всего транзакций: ${current.totalTransactionsCount} (${this.formatChange(
      totalTransactionsCountChangeSum / count,
    )})
  `;

    return report.trim();
  }

  private formatChange(change: number): string {
    const roundedChange = Math.round(change);
    return roundedChange >= 0 ? `+${roundedChange}` : `${roundedChange}`;
  }
}
