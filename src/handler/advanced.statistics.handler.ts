import { Action, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { IContext } from '../interface';
import { actionButtonsAdvancedStatistics, actionButtonsTransactionNames } from '../battons';
import { AdvancedStatisticsService } from '../service/advanced.statistics.service';

@Update()
export class AdvancedStatisticsHandler {
  private readonly logger: Logger = new Logger(AdvancedStatisticsHandler.name);
  constructor(private readonly advancedStatisticsService: AdvancedStatisticsService) {}

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
}
