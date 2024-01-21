import { Middleware } from 'telegraf';
import { Mongo } from '@telegraf/session/mongodb';
import { Redis } from '@telegraf/session/redis';
import { createClient } from 'redis';
import { IContext } from '../interface';
import { ConfigService } from '@nestjs/config';

export function createSessionMiddleware(configService: ConfigService): Middleware<IContext> {
  const redisUsername = configService.getOrThrow('REDIS_USERNAME');
  const redisPassword = configService.getOrThrow('REDIS_PASSWORD');
  const redisHost = configService.getOrThrow('REDIS_HOST');
  const redisPort = parseInt(configService.getOrThrow('REDIS_PORT'), 10);

  const mongodbUrl = configService.getOrThrow('MONGODB_URL');
  const mongodbName = configService.getOrThrow('MONGODB_NAME');

  const redisClient = createClient({
    username: redisUsername,
    password: redisPassword,
    socket: {
      host: redisHost,
      port: redisPort,
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
    url: mongodbUrl,
    database: mongodbName,
  });

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
