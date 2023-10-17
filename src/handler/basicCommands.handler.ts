import { Action, Command, Hears, Help, Start, Update } from 'nestjs-telegraf';
import { actionButtonsStart, currencySet, languageSet, resetButton } from '../battons/app.buttons';
import { IContext, CustomCallbackQuery } from '../interface/context.interface';
import { BalanceService } from '../service';
import { Logger } from '@nestjs/common';
import { ERROR_MESSAGE, HELP_MESSAGE, RESETS_ALL, START_MESSAGE } from '../constants/messages';
import { TransactionService } from '../service';

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
      const userId = ctx.from.id;
      const user = ctx.from;
      this.logger.log(`
      User ID: ${user.id}
      First Name: ${user.first_name}
      Last Name: ${user.last_name}
      Username: ${user.username}`);
      await this.balanceService.createBalance({ userId });
      await ctx.reply('Оберіть мову / Choose language', languageSet());

      await ctx.deleteMessage();
      delete ctx.session.type;
      this.logger.log('startCommand executed successfully');
    } catch (error) {
      this.logger.error('Error in startCommand:', error);
      await ctx.answerCbQuery(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }
  @Action('USD')
  async usdCommand(ctx: IContext) {
    ctx.session.currency = 'USD';
    await ctx.replyWithHTML(
      START_MESSAGE[ctx.session.language || 'ua']['WELCOME_MESSAGE'],
      actionButtonsStart(ctx.session.language),
    );
  }

  @Action('UAH')
  async uahCommand(ctx: IContext) {
    ctx.session.currency = 'UAH';
    await ctx.replyWithHTML(
      START_MESSAGE[ctx.session.language || 'ua']['WELCOME_MESSAGE'],
      actionButtonsStart(ctx.session.language),
    );
  }

  @Action(/setLanguage:(.+)/)
  async setLanguage(ctx: IContext) {
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      ctx.session.language = parts[1];
      await ctx.reply('Оберіть валюту / Choose currency', currencySet());
      this.logger.log('setLanguage command executed');
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Help()
  @Hears(/Help⛑️|Допомога⛑️/)
  async helpCommand(ctx: IContext) {
    try {
      await ctx.deleteMessage();
      await ctx.replyWithHTML(HELP_MESSAGE[ctx.session.language || 'ua']);
      this.logger.log('helpCommand executed');
    } catch (error) {
      this.logger.error('Error in helpCommand:', error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }
  @Command('language')
  async languageCommand(ctx: IContext) {
    try {
      await ctx.deleteMessage();
      await ctx.reply('Оберіть мову / Choose language', languageSet());
      this.logger.log('languageCommand executed');
    } catch (error) {
      this.logger.error('Error in languageCommand:', error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }
  @Command('reset')
  async resetCommand(ctx: IContext) {
    await ctx.reply(RESETS_ALL[ctx.session.language].ARE_YOU_SURE, resetButton(ctx.session.language));
  }
  @Action('yes')
  async yesCommand(ctx: IContext) {
    await ctx.reply(RESETS_ALL[ctx.session.language].CONFIRM_RESET);
    ctx.session.type = 'delete';
  }
  @Action('no')
  async noCommand(ctx: IContext) {
    await ctx.reply(RESETS_ALL[ctx.session.language].RESET_CANCELED);
    delete ctx.session.type;
  }
  @Hears('RESET')
  async resetAll(ctx: IContext) {
    if (ctx.session.type !== 'delete') {
      return;
    }
    const userId = ctx.from.id;
    await this.balanceService.deleteAllBalancesOfUser(userId);
    await this.transactionService.deleteAllTransactionsOfUser(userId);
    await ctx.reply(RESETS_ALL[ctx.session.language].RESET_SUCCESSFUL);
    await this.balanceService.createBalance({ userId });
    await ctx.replyWithHTML(
      START_MESSAGE[ctx.session.language || 'ua']['WELCOME_MESSAGE'],
      actionButtonsStart(ctx.session.language),
    );
    delete ctx.session.type;
  }
}
