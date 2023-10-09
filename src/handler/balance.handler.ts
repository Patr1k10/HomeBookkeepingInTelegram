import { Command, Hears, Update } from 'nestjs-telegraf';
import { BalanceService } from '../service/balance.service';
import { Logger } from '@nestjs/common';
import { IContext } from '../interface/context.interface';
import { ERROR_MESSAGE, getBalanceMessage } from '../constants/messages';

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
      const balance = await this.balanceService.getOrCreateBalance(userId);
      const balanceMessage = getBalanceMessage(balance.balance, ctx.session.language || 'ua');
      await ctx.replyWithHTML(balanceMessage);
      ctx.session.type = 'balance';
      this.logger.log('Баланс command executed');
    } catch (error) {
      this.logger.error('Error in listCommand:', error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }
}