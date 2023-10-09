import { Action, Command, Help, Start, Update } from 'nestjs-telegraf';

import { actionButtonsStart, languageSet } from './app.buttons';
import { IContext, CustomCallbackQuery } from './interface/context.interface';
import { BalanceService } from './service/balance.service';
import { Logger } from '@nestjs/common';
import { ERROR_MESSAGE, HELP_MESSAGE, START_MESSAGE } from './constants/messages';

@Update()
export class AppUpdate {
  private readonly logger: Logger = new Logger(AppUpdate.name);
  constructor(private readonly balanceService: BalanceService) {}

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

  @Action(/setLanguage:(.+)/)
  async setLanguage(ctx: IContext) {
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      ctx.session.language = parts[1];
      await ctx.replyWithHTML(
        START_MESSAGE[ctx.session.language || 'ua']['WELCOME_MESSAGE'],
        actionButtonsStart(ctx.session.language),
      );
      this.logger.log('setLanguage command executed');
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Help()
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
}
