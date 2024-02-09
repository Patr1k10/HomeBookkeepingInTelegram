import { Action, InjectBot, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { IContext } from '../interface';
import { actionButtonsAdvancedStatistics, actionButtonsTransactionNames, backStatisticButton } from '../battons';
import { AdvancedStatisticsService } from '../service';
import { ChartService } from '../service/chart.service';
import { Telegraf } from 'telegraf';

@Update()
export class AdvancedStatisticsHandler {
  private readonly logger: Logger = new Logger(AdvancedStatisticsHandler.name);
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
    private readonly advancedStatisticsService: AdvancedStatisticsService,
    private readonly chartService: ChartService,
  ) {}

  @Action('advanced_statistics')
  async updateAdvancedStatistics(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} updateAdvancedStatistics`);
    await ctx.editMessageText(`Оберіть потрібну вам кнопку`, actionButtonsAdvancedStatistics(ctx.session.language));
  }
  @Action('top10')
  async updateTop10(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} updateAdvancedStatistics`);
    const top10awaitTransactionsName = await this.advancedStatisticsService.getTop10TransactionNamesByCount(
      ctx.from.id,
    );
    await ctx.editMessageText(`оберіть потрібну транзакію`, actionButtonsTransactionNames(top10awaitTransactionsName));
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
      { caption: `Це график 🔝топ10 вашіх транзакцій за весь час `, reply_markup: backStatisticButton().reply_markup },
    );
  }
}
