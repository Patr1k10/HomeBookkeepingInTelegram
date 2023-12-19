import { Action, Hears, Start, Update } from 'nestjs-telegraf';
import {
  actionButtonsStart,
  backHelpButton,
  backStartButton,
  currencySet,
  languageSet,
  resetButton,
} from '../battons/app.buttons';
import { BalanceService } from '../service';
import { Logger } from '@nestjs/common';
import { TransactionService } from '../service';
import { ERROR_MESSAGE, HELP_MESSAGE, MAIN_MENU, RESETS_ALL, START_MESSAGE, SUPPORT_MESSAGE } from '../constants';
import { CustomCallbackQuery, IContext } from '../interface';


@Update()
export class BasicCommandsHandler {
  private readonly logger: Logger = new Logger(BasicCommandsHandler.name);
  constructor(
    private readonly balanceService: BalanceService,
    private readonly transactionService: TransactionService,
  ) {}

  @Start()
  async startCommand(ctx: IContext) {
    try {
      delete ctx.session.selectedDate;
      delete ctx.session.selectedMonth;
      delete ctx.session.selectedYear;
      const userId = ctx.from.id;
      const user = ctx.from;
      const count = await this.balanceService.countAllBalances();
      const activeUsers = await this.balanceService.countActiveUsersLast3Days();
      const bannedUsers = await this.balanceService.countBannedUsers();
      const bosId = process.env.BOSID;
      this.logger.log(`
      User ID: ${user.id}
      First Name: ${user.first_name}
      Last Name: ${user.last_name}
      Username: ${user.username}
      ActiveUsers: ${activeUsers}
      Count Users: ${count}
      BannedUsers: ${bannedUsers}`);
      await this.balanceService.createBalance({ userId });
      await ctx.telegram.sendMessage(
        bosId,
        `New User created:
      User ID: ${user.id}
      First Name: ${user.first_name}
      Last Name: ${user.last_name}
      Username: ${user.username}
      ActiveUsers: ${activeUsers}
      Count Users: ${count}
      BannedUsers: ${bannedUsers}`,
      );
      const sentMessage = await ctx.reply('Оберіть мову / Choose language', languageSet());
      ctx.session.lastBotMessage = sentMessage.message_id;

      await ctx.deleteMessage();
      delete ctx.session.type;
      this.logger.log('startCommand executed successfully');
    } catch (error) {
      this.logger.error('Error in startCommand:', error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }
  @Action('USD')
  async usdCommand(ctx: IContext) {
    ctx.session.currency = 'USD';
    const markup = actionButtonsStart(ctx.session.language);
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      START_MESSAGE[ctx.session.language || 'ua']['WELCOME_MESSAGE'],
      { reply_markup: markup.reply_markup, disable_web_page_preview: true, parse_mode: 'HTML' },
    );
  }

  @Action('UAH')
  async uahCommand(ctx: IContext) {
    ctx.session.currency = 'UAH';
    const markup = actionButtonsStart(ctx.session.language);
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      START_MESSAGE[ctx.session.language || 'ua']['WELCOME_MESSAGE'],
      { reply_markup: markup.reply_markup, disable_web_page_preview: true, parse_mode: 'HTML' },
    );
  }

  @Action(/setLanguage:(.+)/)
  async setLanguage(ctx: IContext) {
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const markup = currencySet();
      ctx.session.language = parts[1];
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        'Оберіть валюту / Choose currency',
        { reply_markup: markup.reply_markup, disable_web_page_preview: true, parse_mode: 'HTML' },
      );
      this.logger.log('setLanguage command executed');
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }

  @Action('help')
  async helpCommand(ctx: IContext) {
    const markup = backHelpButton(ctx.session.language);
    try {
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        HELP_MESSAGE[ctx.session.language || 'ua'],
        { reply_markup: markup.reply_markup, disable_web_page_preview: true, parse_mode: 'HTML' },
      );
      this.logger.log('helpCommand executed');
    } catch (error) {
      this.logger.error('Error in helpCommand:', error);
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
      this.logger.log('languageCommand executed');
    } catch (error) {
      this.logger.error('Error in languageCommand:', error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }
  @Action('reset')
  async resetCommand(ctx: IContext) {
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      RESETS_ALL[ctx.session.language || 'ua'].ARE_YOU_SURE,
      resetButton(ctx.session.language),
    );
  }
  @Action('yes')
  async yesCommand(ctx: IContext) {
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      RESETS_ALL[ctx.session.language || 'ua'].CONFIRM_RESET,
    );
    ctx.session.type = 'delete';
  }
  @Action('no')
  async noCommand(ctx: IContext) {
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      RESETS_ALL[ctx.session.language || 'ua'].RESET_CANCELED,
      actionButtonsStart(ctx.session.language),
    );
    delete ctx.session.type;
  }
  @Hears('RESET')
  async resetAll(ctx: IContext) {
    if (ctx.session.type !== 'delete') {
      return;
    }
    await ctx.deleteMessage();
    const userId = ctx.from.id;
    await this.balanceService.deleteAllBalancesOfUser(userId);
    await this.transactionService.deleteAllTransactionsOfUser(userId);
    await ctx.reply(RESETS_ALL[ctx.session.language || 'ua'].RESET_SUCCESSFUL);
    await this.balanceService.createBalance({ userId });
    const sendMessage = await ctx.replyWithHTML(
      START_MESSAGE[ctx.session.language || 'ua']['WELCOME_MESSAGE'],
      actionButtonsStart(ctx.session.language || 'ua'),
    );
    ctx.session.lastBotMessage = sendMessage.message_id;

    delete ctx.session.type;
  }

  @Action('project_support')
  async getProjectSupport(ctx: IContext) {
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      SUPPORT_MESSAGE[ctx.session.language || 'ua'],
      {
        reply_markup: backStartButton(ctx.session.language).reply_markup,
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      },
    );
  }

  @Action('backToStart')
  async backToStart(ctx: IContext) {
    await ctx.deleteMessage();
    delete ctx.session.selectedDate;
    delete ctx.session.selectedMonth;
    delete ctx.session.selectedYear;
    ctx.session.awaitingUserIdInput = false;
    const sentMessage = await ctx.reply('Оберіть мову / Choose language', languageSet());
    ctx.session.lastBotMessage = sentMessage.message_id;
  }

  @Action('back')
  async back(ctx: IContext) {
    delete ctx.session.selectedDate;
    delete ctx.session.selectedMonth;
    delete ctx.session.selectedYear;
    ctx.session.awaitingUserIdInput = false;
    delete ctx.session.type;
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      MAIN_MENU[ctx.session.language || 'ua'],
      actionButtonsStart(ctx.session.language || 'ua'),
    );
  }
}
