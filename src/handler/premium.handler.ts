import { Action, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { BalanceService } from '../service';
import { IContext } from '../interface';
import { PREMIUM_MENU, PREMIUM_MESSAGE, PREMIUM_SET, TRIAL_PROVIDED, TRIAL_PROVIDED_FALSE } from '../constants';
import { actionButtonsPremium, actionButtonsPremiumMenu, actionSetPremium, backStartButton } from '../battons';

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
      `${PREMIUM_SET[ctx.session.language]}`,
      {
        reply_markup: actionSetPremium(ctx.session.language).reply_markup,
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      },
    );
  }
  @Action('trialPremium')
  async trialPremium(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} trialPremium`);
    const result = await this.balanceService.setIsPremium(ctx.from.id, 14);
    if (result === false) {
      this.logger.log(`User:${ctx.from.id} Premium is already active for more than 3 days. No changes made.`);
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        `${TRIAL_PROVIDED_FALSE[ctx.session.language]}`,
        {
          reply_markup: backStartButton(ctx.session.language).reply_markup,
          disable_web_page_preview: true,
          parse_mode: 'HTML',
        },
      );
    } else {
      ctx.session.isPremium = await this.balanceService.getIsPremium(ctx.from.id);
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        `${TRIAL_PROVIDED[ctx.session.language]}`,
        {
          reply_markup: backStartButton(ctx.session.language).reply_markup,
          disable_web_page_preview: true,
          parse_mode: 'HTML',
        },
      );
    }
  }
  @Action('premiumMenu')
  async premiumMenu(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} getPremiumMenu`);
    await ctx.telegram.editMessageText(ctx.from.id, ctx.session.lastBotMessage, null, `Тут буде преміум функционал`, {
      reply_markup: actionButtonsPremiumMenu(ctx.session.language).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }
}
