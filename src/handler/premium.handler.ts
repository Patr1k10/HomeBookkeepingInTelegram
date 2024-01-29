import { Action, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { BalanceService, CryptoService, CurrencyService, PremiumService } from '../service';
import { CustomCallbackQuery, IContext } from '../interface';
import {
  BAY_PREMIUM_MENU,
  CRYPTO_MESSAGE,
  CURRENCY_MESSAGE,
  PREMIUM_MESSAGE,
  PREMIUM_SET,
  SELECT_CURRENCY_MESSAGE,
  TRIAL_PROVIDED,
  TRIAL_PROVIDED_FALSE,
} from '../constants';
import {
  actionButtonsBackPremium,
  actionButtonsPremium,
  actionButtonsPremiumMenu,
  actionSetPremium,
  backStartButton,
  generateCryptoButtons,
  generateCurrencyButtons,
} from '../battons';
import { resetSession } from '../common/reset.session';

@Update()
export class PremiumHandler {
  private readonly logger: Logger = new Logger(PremiumHandler.name);
  constructor(
    private readonly balanceService: BalanceService,
    private readonly currencyService: CurrencyService,
    private readonly cryptoService: CryptoService,
    private readonly premiumService: PremiumService,
  ) {}

  @Action('getPremium')
  async getPremium(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} getPremium`);
    const premiumDays = await this.premiumService.getRemainingPremiumDays(ctx.from.id);
    await ctx.editMessageText(`${premiumDays} ${PREMIUM_MESSAGE[ctx.session.language || 'ua']}`, {
      reply_markup: backStartButton(ctx.session.language).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }
  @Action('premium')
  async premium(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} premium`);
    await ctx.editMessageText(`${BAY_PREMIUM_MENU[ctx.session.language || 'ua']}`, {
      reply_markup: actionButtonsPremium(ctx.session.language, ctx.session.isPremium).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }
  @Action('setPremium')
  async setPremium(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} setPremium`);
    await ctx.editMessageText(`${PREMIUM_SET[ctx.session.language]}`, {
      reply_markup: actionSetPremium(ctx.session.language).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }
  @Action('trialPremium')
  async trialPremium(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} trialPremium`);
    const result = await this.premiumService.setIsPremium(ctx.from.id, 14);
    if (result === false) {
      this.logger.log(`User:${ctx.from.id} Premium is already active for more than 3 days. No changes made.`);
      await ctx.editMessageText(`${TRIAL_PROVIDED_FALSE[ctx.session.language]}`, {
        reply_markup: backStartButton(ctx.session.language).reply_markup,
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      });
    } else {
      ctx.session.isPremium = await this.premiumService.getIsPremium(ctx.from.id);
      await ctx.editMessageText(`${TRIAL_PROVIDED[ctx.session.language]}`, {
        reply_markup: backStartButton(ctx.session.language).reply_markup,
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      });
    }
  }
  @Action('premiumMenu')
  async premiumMenu(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} getPremiumMenu`);
    await ctx.editMessageText(`${BAY_PREMIUM_MENU[ctx.session.language || 'ua']}`, {
      reply_markup: actionButtonsPremiumMenu(ctx.session.language).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }
  @Action('exchange_rate')
  async exchangeRate(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} getPremiumMenu`);
    const currencyData = await this.currencyService.getCurrencyData();
    await ctx.editMessageText(`${SELECT_CURRENCY_MESSAGE[ctx.session.language]}`, {
      reply_markup: generateCurrencyButtons(currencyData).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }
  @Action(/Currency:(.+)/)
  async exchangeCurrency(ctx: IContext) {
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const currencyName = parts[1];
      const currencyBay = parts[2];
      const currencySell = parts[3];
      const message = CURRENCY_MESSAGE(currencyName, currencyBay, currencySell, ctx.session.language);
      await ctx.editMessageText(`${message}`, {
        reply_markup: actionButtonsBackPremium(ctx.session.language).reply_markup,
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      });
      this.logger.log(`user:${ctx.from.id} exchangeCurrency Currency:${currencyName}`);
    }
  }
  @Action('crypto_currency_course')
  async cryptoCourse(ctx: IContext) {
    this.logger.log(`User:${ctx.from.id}cryptoCourse`);
    const cryptoAssetData = await this.cryptoService.getCryptoAsset();
    await ctx.editMessageText(`${SELECT_CURRENCY_MESSAGE[ctx.session.language]}`, {
      reply_markup: generateCryptoButtons(cryptoAssetData).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }
  @Action(/Crypto:(.+)/)
  async crypto(ctx: IContext) {
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const cryptoName = parts[1];
      const cryptoSymbol = parts[2];
      const cryptoPriceUsd = parts[3];
      const cryptoChangePercent24Hr = parts[4];
      const message = CRYPTO_MESSAGE(
        cryptoName,
        cryptoSymbol,
        cryptoPriceUsd,
        cryptoChangePercent24Hr,
        ctx.session.language,
      );
      await ctx.editMessageText(`${message}`, {
        reply_markup: actionButtonsBackPremium(ctx.session.language).reply_markup,
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      });
      this.logger.log(`User:${ctx.from.id} crypto ${cryptoSymbol}`);
    }
  }
  @Action('backP')
  async backP(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} backF`);
    resetSession(ctx);
    await ctx.editMessageText(
      `${BAY_PREMIUM_MENU[ctx.session.language || 'ua']}`,
      actionButtonsPremiumMenu(ctx.session.language || 'ua'),
    );
  }
}
