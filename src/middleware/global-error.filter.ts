import { languageSet } from '../battons/app.buttons';
import { IContext } from '../interface';
import { Middleware } from 'telegraf';

export function errorHandlingMiddleware(): Middleware<IContext> {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const bosId = process.env.BOSID;
        await ctx.telegram.sendMessage(bosId, `Произошла ошибка: ${error.message}`);
        return;
      }
      const bosId = process.env.BOSID;
      await ctx.telegram.sendMessage(bosId, `Произошла ошибка: ${error.message}`);
      const sentMessage = await ctx.reply('Оберіть мову / Choose language', languageSet());
      ctx.session.lastBotMessage = sentMessage.message_id;
      console.log('errorHandlingMiddleware');
    }
  };
}
