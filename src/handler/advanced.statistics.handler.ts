import { Action, InjectBot, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { CustomCallbackQuery, IContext } from '../interface';
import { actionButtonsAdvancedStatistics, actionButtonsTransactionNames, backStatisticButton } from '../battons';
import { AdvancedStatisticsService, StatisticsService } from '../service';
import { ChartService } from '../service/chart.service';
import { Telegraf } from 'telegraf';
import { ADVANCE_STATISTICS, SELECT_PERIOD, SELECT_TRANSACTION_MESSAGE, TOP10 } from '../constants';

@Update()
export class AdvancedStatisticsHandler {
  private readonly logger: Logger = new Logger(AdvancedStatisticsHandler.name);
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
    private readonly advancedStatisticsService: AdvancedStatisticsService,
    private readonly chartService: ChartService,
    private readonly statsService: StatisticsService,
  ) {}

  @Action('advanced_statistics')
  async updateAdvancedStatistics(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} updateAdvancedStatistics`);
    await ctx.editMessageText(
      `${ADVANCE_STATISTICS[ctx.session.language || 'ua']}`,
      actionButtonsAdvancedStatistics(ctx.session.language),
    );
  }
  @Action('top10')
  async updateTop10(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} updateAdvancedStatistics`);
    const top10awaitTransactionsName = await this.advancedStatisticsService.getTop10TransactionNamesByCount(
      ctx.from.id,
    );
    await ctx.editMessageText(
      `${SELECT_TRANSACTION_MESSAGE[ctx.session.language || 'ua']}`,
      actionButtonsTransactionNames(top10awaitTransactionsName),
    );
  }
  @Action('schedule')
  async updateAdvancedStatisticsSchedule(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} updateAdvancedStatistics`);
    const top10 = await this.advancedStatisticsService.getTop10Transaction(ctx.from.id);
    const chart = await this.chartService.generateTransactionChart(top10);
    const imageBuffer = Buffer.from(chart, 'base64');
    await ctx.deleteMessage();

    await ctx.replyWithPhoto(
      { source: imageBuffer },
      { caption: `${TOP10[ctx.session.language || 'ua']} `, reply_markup: backStatisticButton().reply_markup },
    );
  }
  @Action('get_сhart')
  async getCustomChart(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} get_сhart `);
    const transaction = await this.statsService.getTransactionsForChard(ctx, ctx.session.transactionQuery);
    const chart = await this.chartService.generateCustomChart(
      transaction,
      ctx.session.transactionQuery,
      ctx.session.language,
    );
    const imageBuffer = Buffer.from(chart, 'base64');
    await ctx.deleteMessage();
    await ctx.replyWithPhoto(
      { source: imageBuffer },
      { caption: `${SELECT_PERIOD[ctx.session.language || 'ua']}`, reply_markup: backStatisticButton().reply_markup },
    );
  }
}
