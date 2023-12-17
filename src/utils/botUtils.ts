import { languageSet } from '../battons/app.buttons';
import { IContext } from '../interface';

export async function checkAndUpdateLastBotMessage(ctx: IContext) {
  if (!ctx.session.lastBotMessage) {
    const sentMessage = await ctx.reply('Оберіть мову / Choose language', languageSet());
    ctx.session.lastBotMessage = sentMessage.message_id;
    console.log('checkAndUpdateLastBotMessage');
    return true;
  }
  return false;
}
