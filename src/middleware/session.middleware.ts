import { Middleware } from 'telegraf';
import { Mongo } from '@telegraf/session/mongodb';
import { Redis } from '@telegraf/session/redis';
import * as dotenv from 'dotenv';
import { createClient } from 'redis';
import { IContext } from '../interface';

dotenv.config();

const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
  },
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

const redisStore = Redis({ client: redisClient });

const mongoStore = Mongo({
  url: process.env.MONGODB_URL,
  database: process.env.MONGODB_NAME,
});

export function createSessionMiddleware(): Middleware<IContext> {
  return async (ctx, next) => {
    const key = ctx.from && ctx.chat ? `${ctx.from.id}:${ctx.chat.id}` : null;

    if (key) {
      const redisSession = await redisStore.get(key);
      if (!redisSession) {
        ctx.session = await mongoStore.get(key);
        if (!ctx.session) {
          ctx.session = {};
        }
      } else {
        ctx.session = redisSession;
      }

      ctx.session.lastActivity = Date.now();
      await next();
      await redisStore.set(key, ctx.session);
      await mongoStore.set(key, ctx.session);
    } else {
      await next();
    }
  };
}
