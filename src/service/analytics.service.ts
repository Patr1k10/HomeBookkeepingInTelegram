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
}
