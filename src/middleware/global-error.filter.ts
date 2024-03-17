import { IContext } from '../type/interface';
import { Middleware } from 'telegraf';
import { actionButtonsStart, backStartButton } from '../battons';
import { MAIN_MENU } from '../constants';

export function errorHandlingMiddleware(): Middleware<IContext> {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const bosId = process.env.BOSID;
        await ctx.telegram.sendMessage(bosId, `Произошла ошибка: ${error.message}`, backStartButton());
        return;
      }
      // await ctx.deleteMessage();
      const bosId = process.env.BOSID;
      await ctx.telegram.sendMessage(bosId, `Произошла ошибка: ${error.message}`, backStartButton());
      await ctx.replyWithHTML(`${MAIN_MENU[ctx.session.language || 'ua']}`, {
        parse_mode: 'HTML',
        reply_markup: actionButtonsStart(ctx.session.language || 'ua', ctx.session.isPremium).reply_markup,
      });
      console.log('errorHandlingMiddleware');
    }
  };
}
