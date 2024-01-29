import { Action, Hears, On, Start, Update } from 'nestjs-telegraf';
import { BalanceService, NotificationService, PremiumService, TransactionService } from '../service';
import { Logger } from '@nestjs/common';
import {
  ERROR_MESSAGE,
  HELP_MESSAGE,
  MAIN_MENU,
  RESETS_ALL,
  SELECT_SETTING_MESSAGE,
  START_MESSAGE,
  SUPPORT_MESSAGE,
} from '../constants';
import { CustomCallbackQuery, IContext, MyMessage } from '../interface';
import {
  actionButtonsAdmin,
  actionButtonsSettings,
  actionButtonsStart,
  backHelpButton,
  backStartButton,
  currencySet,
  languageSet,
  resetButton,
} from '../battons';
import { resetSession } from '../common/reset.session';

@Update()
export class BasicCommandsHandler {
  private readonly logger: Logger = new Logger(BasicCommandsHandler.name);
  constructor(
    private readonly balanceService: BalanceService,
    private readonly transactionService: TransactionService,
    private readonly premiumService: PremiumService,
    private readonly notificationService: NotificationService,
  ) {}

  @Start()
  async startCommand(ctx: IContext) {
    try {
      // await ctx.deleteMessage();
      resetSession(ctx);
      ctx.session.compare = [];
      await ctx.replyWithHTML('👋');
      await this.premiumService.deductPremiumFromUser(ctx.from.id);
      await this.balanceService.createBalance(ctx.from.id);
      ctx.session.isPremium = await this.premiumService.getIsPremium(ctx.from.id);
      const sentMessage = await ctx.reply('Оберіть мову / Choose language', languageSet());
      ctx.session.lastBotMessage = sentMessage.message_id;
      this.logger.log(`user:${ctx.from.id} startCommand executed successfully`);
    } catch (error) {
      this.logger.error('Error in startCommand:', error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }
  @Action('USD')
  async usdCommand(ctx: IContext) {
    ctx.session.currency = 'USD';
    const markup = actionButtonsStart(ctx.session.language, ctx.session.isPremium);
    await ctx.editMessageText(START_MESSAGE[ctx.session.language || 'ua']['WELCOME_MESSAGE'], {
      reply_markup: markup.reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
    this.logger.log(`user:${ctx.from.id} usdCommand `);
  }

  @Action('UAH')
  async uahCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} uahCommand `);
    ctx.session.currency = 'UAH';
    const markup = actionButtonsStart(ctx.session.language, ctx.session.isPremium);
    await ctx.editMessageText(START_MESSAGE[ctx.session.language || 'ua']['WELCOME_MESSAGE'], {
      reply_markup: markup.reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }

  @Action(/setLanguage:(.+)/)
  async setLanguage(ctx: IContext) {
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const markup = currencySet();
      ctx.session.language = parts[1];
      await ctx.editMessageText('Оберіть валюту / Choose currency', {
        reply_markup: markup.reply_markup,
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      });
      this.logger.log(`user:${ctx.from.id} setLanguage command executed`);
    } else {
      this.logger.log(`user:${ctx.from.id} callbackQuery is undefined`);
    }
  }

  @Action('help')
  async helpCommand(ctx: IContext) {
    const markup = backHelpButton(ctx.session.language);
    try {
      await ctx.editMessageText(HELP_MESSAGE[ctx.session.language || 'ua'], {
        reply_markup: markup.reply_markup,
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      });
      this.logger.log(`user:${ctx.from.id} helpCommand executed`);
    } catch (error) {
      this.logger.error(`user:${ctx.from.id} Error in helpCommand:`, error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
      ctx.editedMessage;
    }
  }
  @Action('language')
  async languageCommand(ctx: IContext) {
    try {
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        'Оберіть мову / Choose language',
        languageSet(),
      );
      this.logger.log(`user:${ctx.from.id} languageCommand executed`);
    } catch (error) {
      this.logger.error(`user:${ctx.from.id} Error in languageCommand:`, error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }
  @Action('reset')
  async resetCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} resetCommand executed`);
    await ctx.editMessageText(RESETS_ALL[ctx.session.language || 'ua'].ARE_YOU_SURE, resetButton(ctx.session.language));
  }
  @Action('yes')
  async yesCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} yesCommand`);
    await ctx.editMessageText(RESETS_ALL[ctx.session.language || 'ua'].CONFIRM_RESET);
    ctx.session.type = 'delete';
  }
  @Action('no')
  async noCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} noCommand`);
    await ctx.editMessageText(
      RESETS_ALL[ctx.session.language || 'ua'].RESET_CANCELED,
      actionButtonsStart(ctx.session.language, ctx.session.isPremium),
    );
    delete ctx.session.type;
  }
  @Hears('RESET')
  async resetAll(ctx: IContext) {
    if (ctx.session.type !== 'delete') {
      return;
    }
    this.logger.log(`user:${ctx.from.id} resetAllCommand`);
    await ctx.deleteMessage();
    await this.balanceService.deleteAllBalancesOfUser(ctx.from.id);
    await this.transactionService.deleteAllTransactionsOfUser(ctx.from.id);
    await ctx.reply(RESETS_ALL[ctx.session.language || 'ua'].RESET_SUCCESSFUL);
    await this.balanceService.createBalance(ctx.from.id);
    const sendMessage = await ctx.replyWithHTML(
      START_MESSAGE[ctx.session.language || 'ua']['WELCOME_MESSAGE'],
      actionButtonsStart(ctx.session.language || 'ua', ctx.session.isPremium),
    );
    ctx.session.lastBotMessage = sendMessage.message_id;

    delete ctx.session.type;
  }

  @Action('project_support')
  async getProjectSupport(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} getProjectSupport `);
    await ctx.telegram.sendMessage(process.env.BOSID, `user:${ctx.from.id} getProjectSupport`);
    await ctx.editMessageText(SUPPORT_MESSAGE[ctx.session.language || 'ua'], {
      reply_markup: backStartButton(ctx.session.language).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }
  @Action('settings')
  async getSettings(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} getSettings`);
    this.logger.log(`lastBotMessage:${ctx.session.lastBotMessage}`);
    await ctx.editMessageText(SELECT_SETTING_MESSAGE[ctx.session.language || 'ua'], {
      reply_markup: actionButtonsSettings(ctx.session.language, ctx.from.id).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }

  @Action('admin')
  async adminMenuCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} admin menu command executed`);
    await ctx.editMessageText('Це адмін манель ти знаешь що робити', actionButtonsAdmin());
  }
  @Action('adminStat')
  async adminStatMenuCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} adminStat menu command executed`);
    const user = ctx.from;
    ctx.session.isPremium = await this.premiumService.getIsPremium(ctx.from.id);
    const count = await this.balanceService.countAllBalances();
    const activeUsers = await this.balanceService.countActiveUsersLast3Days();
    const bannedUsers = await this.balanceService.countBannedUsers();
    const countIsPremiumUser = await this.premiumService.countPremiumUsers();
    this.logger.log(`
      User ID: ${user.id}
      First Name: ${user.first_name}
      Last Name: ${user.last_name}
      Username: ${user.username}
      ActiveUsers: ${activeUsers}
      Count Users: ${count}
      Count PremiumUsers: ${countIsPremiumUser}
      BannedUsers: ${bannedUsers}
      `);
    await ctx.editMessageText(
      `New User created:
      User ID: ${user.id}
      First Name: ${user.first_name}
      Last Name: ${user.last_name}
      Username: ${user.username}
      ActiveUsers: ${activeUsers}
      Count Users: ${count}
      Count PremiumUsers: ${countIsPremiumUser}
      BannedUsers: ${bannedUsers}`,
      backStartButton(),
    );
  }
  @Action('sendNews')
  async sendNews(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} sendNews`);
    await ctx.editMessageText(`нваиши новини та її побачать усі🔽🔽🔽`, backStartButton());
    ctx.session.type = 'sendNewsAllUser';
  }
  @On('text')
  async sendNewsAllUser(ctx: IContext) {
    if (ctx.session.type !== 'sendNewsAllUser') {
      return;
    }
    const message = ctx.message as MyMessage;
    const { elapsedTime, notificationCount } = await this.notificationService.notificationsAll(message.text);
    await ctx.deleteMessage();
    await ctx.replyWithHTML(
      `час на відправку:${elapsedTime}сек. 
       новину отримали ${notificationCount} юзерів `,
      backStartButton(),
    );
    delete ctx.session.type;
  }
  @Action('backToStart')
  async backToStart(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} backToStart`);
    await ctx.deleteMessage();
    resetSession(ctx);
    ctx.session.isPremium = await this.premiumService.getIsPremium(ctx.from.id);
    const sentMessage = await ctx.reply('Оберіть мову / Choose language', languageSet());
    ctx.session.lastBotMessage = sentMessage.message_id;
  }

  @Action('back')
  async back(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} back`);
    await this.premiumService.deductPremiumFromUser(ctx.from.id);
    ctx.session.isPremium = await this.premiumService.getIsPremium(ctx.from.id);
    this.logger.log(`user:${ctx.from.id} back`);
    resetSession(ctx);
    await ctx.editMessageText(
      MAIN_MENU[ctx.session.language || 'ua'],
      actionButtonsStart(ctx.session.language || 'ua', ctx.session.isPremium),
    );
  }
}
