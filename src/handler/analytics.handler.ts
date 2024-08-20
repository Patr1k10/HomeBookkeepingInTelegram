import { Logger } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { IContext } from '../type/interface';
import { MAIN_MENU } from '../constants';
import {
  actionButtonsAdmin,
  actionButtonsAnalytics,
  actionButtonsBackSettings,
  actionButtonsSettings,
} from '../battons';
import { AdvancedStatisticsService, AnalyticsService } from '../service';

@Update()
export class AnalyticsHandler {
  private readonly logger: Logger = new Logger(AnalyticsHandler.name);
  constructor(private readonly analyticsService: AnalyticsService) {}
  @Action('bot_analytics')
  async botAnalytics(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} bot_analytics`);
    await ctx.editMessageText(
      'Оберіть аналітику за потрібний вам період:',
      actionButtonsAnalytics(ctx.session.language || 'ua'),
    );
  }
  @Action('for_today')
  async for_today(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} for_today`);
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const period = 'for_today';
    const message = await this.analyticsService.generateReport(yesterday, today, period);

    await ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: actionButtonsBackSettings().reply_markup });
  }

  @Action('for_week')
  async for_week(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} for_week`);
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    const period = 'for_week';
    const message = await this.analyticsService.generateReport(weekAgo, today, period);

    await ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: actionButtonsBackSettings().reply_markup });
  }

  @Action('for_month')
  async for_month(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} for_month`);
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const monthAgo = new Date();
    monthAgo.setMonth(today.getMonth() - 1);
    const period = 'for_month';
    const message = await this.analyticsService.generateReport(monthAgo, today, period);

    await ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: actionButtonsBackSettings().reply_markup });
  }

  @Action('for_3_month')
  async for_half_a_year(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} for_half_a_year`);
    const today = new Date();
    today.setDate(today.getDate() - 1);
    this.logger.log(today);
    const halfYearAgo = new Date();
    halfYearAgo.setMonth(today.getMonth() - 3);
    const period = 'for_3_month';
    const message = await this.analyticsService.generateReport(halfYearAgo, today, period);

    await ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: actionButtonsBackSettings().reply_markup });
  }
}
