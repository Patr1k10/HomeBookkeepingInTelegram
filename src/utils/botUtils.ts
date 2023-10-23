import { IContext } from '../interface/context.interface';
import { languageSet } from '../battons/app.buttons';

export async function checkAndUpdateLastBotMessage(ctx: IContext) {
  if (!ctx.session.lastBotMessage) {
    const sentMessage = await ctx.reply('Оберіть мову / Choose language', languageSet());
    ctx.session.lastBotMessage = sentMessage.message_id;
    return true;
  }
  return false;
}
