import { Action, Update } from 'nestjs-telegraf';
import { BalanceService } from '../service';
import { Logger } from '@nestjs/common';
import { backStartButton, languageSet } from '../battons/app.buttons';
import { checkAndUpdateLastBotMessage } from '../utils/botUtils';
import { ERROR_MESSAGE, getBalanceMessage } from '../constants';
import { IContext } from '../interface';
import { Telegraf } from 'telegraf';

@Update()
export class BalanceHandler {
  private readonly logger: Logger = new Logger(BalanceHandler.name);
  constructor(private readonly balanceService: BalanceService) {}

  @Action('balance')
  async listCommand(ctx: IContext) {
    try {
      if (await checkAndUpdateLastBotMessage(ctx)) {
        return;
      }
      const userId = ctx.from.id;
      const balance = await this.balanceService.getBalance(userId, ctx.session.group);
      const markup = backStartButton(ctx.session.language);
      const balanceMessage = getBalanceMessage(balance, ctx.session.language || 'ua', ctx.session.currency || 'UAH');
      await ctx.telegram.editMessageText(ctx.chat.id, ctx.session.lastBotMessage, null, balanceMessage, {
        parse_mode: 'HTML',
        reply_markup: markup.reply_markup,
      });

      ctx.session.type = 'balance';
      this.logger.log('Баланс command executed');
    } catch (error) {
      if (error.description === 'Bad Request: message to edit not found') {
        // Возможно, сообщение было удалено или не существует, отправьте новое сообщение
        const sentMessage = await ctx.reply('Оберіть мову / Choose language', languageSet());
        ctx.session.lastBotMessage = sentMessage.message_id;
        return;
      }

      this.logger.error('Error in listCommand:', error);
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        ERROR_MESSAGE[ctx.session.language || 'ua'],
      );
    }
  }
}
