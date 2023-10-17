import { Command, Hears, Update } from 'nestjs-telegraf';
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
  @Hears(/Balance 💰|Баланс 💰/)
  async listCommand(ctx: IContext) {
    try {
      await ctx.deleteMessage();
      const userId = ctx.from.id;
      const balance = await this.balanceService.getBalance(userId, ctx.session.group);
      const balanceMessage = getBalanceMessage(balance, ctx.session.language || 'ua', ctx.session.currency || 'UAH');
      await ctx.replyWithHTML(balanceMessage, actionButtonsStart(ctx.session.language));
      ctx.session.type = 'balance';
      this.logger.log('Баланс command executed');
    } catch (error) {
      this.logger.error('Error in listCommand:', error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }
}
