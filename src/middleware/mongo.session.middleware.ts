import { Middleware} from 'telegraf';
import { Mongo } from '@telegraf/session/mongodb';
import * as dotenv from 'dotenv';
import { IContext } from '../interface/context.interface';

dotenv.config();

export function createMongoSessionMiddleware(): Middleware<IContext> {
  const store = Mongo({
    url: process.env.MONGODB_URL,
    database: process.env.MONGODB_NAME,
  });

  return async (ctx, next) => {
    const key = ctx.from && ctx.chat ? `${ctx.from.id}:${ctx.chat.id}` : null;

    if (key) {
      ctx.session = await store.get(key);
      await next();
      await store.set(key, ctx.session);
    } else {
      await next();
    }
  };
}
