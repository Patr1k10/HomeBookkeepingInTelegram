import { IContext } from '../type/interface';
import { actionButtonsCompare } from '../battons';

export async function sendSplitMessage(messages: string[], ctx: IContext) {
  for (const [index, part] of messages.entries()) {
    if (index === 0) {
      await ctx.editMessageText(part, {
        parse_mode: 'HTML',
        reply_markup: actionButtonsCompare(ctx.session.language || 'ua', ctx.session.isPremium, ctx).reply_markup,
      });
    } else {
      await ctx.reply(part, {
        parse_mode: 'HTML',
        reply_markup: actionButtonsCompare(ctx.session.language || 'ua', ctx.session.isPremium, ctx).reply_markup,
      });
    }
  }
}
