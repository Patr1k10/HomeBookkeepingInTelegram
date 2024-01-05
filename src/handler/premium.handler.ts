import { Action, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { BalanceService } from '../service';
import { IContext } from '../interface';
import { PREMIUM_MENU, PREMIUM_MESSAGE } from '../constants';
import { actionButtonsPremium, backStartButton } from '../battons';

@Update()
export class PremiumHandler {
  private readonly logger: Logger = new Logger(PremiumHandler.name);
  constructor(private readonly balanceService: BalanceService) {}

  @Action('getPremium')
  async getPremium(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} getPremium`);
    const premiumDays = await this.balanceService.getRemainingPremiumDays(ctx.from.id);
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      `${premiumDays} ${PREMIUM_MESSAGE[ctx.session.language || 'ua']}`,
      {
        reply_markup: backStartButton(ctx.session.language).reply_markup,
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      },
    );
  }
  @Action('premium')
  async premium(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} premium`);
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      `${PREMIUM_MENU[ctx.session.language]}`,
      {
        reply_markup: actionButtonsPremium(ctx.session.language, ctx.session.isPremium).reply_markup,
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      },
    );
  }
  @Action('setPremium')
  async setPremium(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} setPremium`);
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      `Тут буде функціонал для отримання преміум доступу😎`,
      {
        reply_markup: backStartButton(ctx.session.language).reply_markup,
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      },
    );
  }
}
