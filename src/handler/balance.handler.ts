import { Action, Command, Hears, Update } from 'nestjs-telegraf';
import { BalanceService } from '../service';
import { Logger } from '@nestjs/common';
import { IContext } from '../interface/context.interface';
import { ERROR_MESSAGE, getBalanceMessage } from '../constants/messages';
import { actionButtonsStart } from '../battons/app.buttons';

@Update()
export class BalanceHandler {
  private readonly logger: Logger = new Logger(BalanceHandler.name);
  constructor(private readonly balanceService: BalanceService) {}

  @Command('balance')
  @Action('balance')
  async listCommand(ctx: IContext) {
    try {
      if (ctx.session.lastBotMessage) {
        const userId = ctx.from.id;
        const balance = await this.balanceService.getBalance(userId, ctx.session.group);
        const markup = actionButtonsStart(ctx.session.language);
        const balanceMessage = getBalanceMessage(balance, ctx.session.language || 'ua', ctx.session.currency || 'UAH');
        await ctx.telegram.editMessageText(ctx.chat.id, ctx.session.lastBotMessage, null, balanceMessage, {
          parse_mode: 'HTML',
          reply_markup: markup.reply_markup,
        });
      }
      ctx.session.type = 'balance';
      this.logger.log('Баланс command executed');
    } catch (error) {
      this.logger.error('Error in listCommand:', error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }
}
