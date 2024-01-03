import { Action, Update } from 'nestjs-telegraf';
import { BalanceService } from '../service';
import { Logger } from '@nestjs/common';
import { ERROR_MESSAGE, getBalanceMessage } from '../constants';
import { IContext } from '../interface';
import { backStartButton, languageSet } from '../battons';
import { resetSession } from '../common/reset.session';

@Update()
export class BalanceHandler {
  private readonly logger: Logger = new Logger(BalanceHandler.name);
  constructor(private readonly balanceService: BalanceService) {}

  @Action('balance')
  async listCommand(ctx: IContext) {
    try {
      resetSession(ctx);
      const userId = ctx.from.id;
      const balance = await this.balanceService.getBalance(userId, ctx.session.group);
      const markup = backStartButton(ctx.session.language);
      const balanceMessage = getBalanceMessage(balance, ctx.session.language || 'ua', ctx.session.currency || 'UAH');
      await ctx.telegram.editMessageText(ctx.chat.id, ctx.session.lastBotMessage, null, balanceMessage, {
        parse_mode: 'HTML',
        reply_markup: markup.reply_markup,
      });
      ctx.session.type = 'balance';
      this.logger.log(`user:${ctx.from.id} balance command executed`);
    } catch (error) {
      if (error.description === 'Bad Request: message to edit not found') {
        const sentMessage = await ctx.reply('Оберіть мову / Choose language', languageSet());
        ctx.session.lastBotMessage = sentMessage.message_id;
        return;
      }
      this.logger.error(`user:${ctx.from.id}Error in listCommand:`, error);
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        ERROR_MESSAGE[ctx.session.language || 'ua'],
      );
    }
  }
}
