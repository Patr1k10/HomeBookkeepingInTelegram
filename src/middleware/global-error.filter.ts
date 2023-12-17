import { languageSet } from '../battons/app.buttons';
import { IContext } from '../interface';
import { Middleware } from 'telegraf';

export function errorHandlingMiddleware(): Middleware<IContext> {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      if (
        error.description === 'Bad Request: message to edit not found' ||
        error.description ===
          'Bad Request: message is not modified: specified new message content and reply markup are exactly the same as the current content and reply markup of the message'
      ) {
        const sentMessage = await ctx.reply('Оберіть мову / Choose language', languageSet());
        ctx.session.lastBotMessage = sentMessage.message_id;
        console.log('errorHandlingMiddleware ');
        return;
      }
      // await ctx.reply(`Произошла ошибка: ${error.message}`);
      console.error('Error in middleware:', error);
    }
  };
}
