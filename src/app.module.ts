import { Logger, Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import * as services from './service';
import * as dotenv from 'dotenv';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MongooseConfigService } from './mongodb/mongoose-config.service';
import * as handlers from './handler/index';
import { Balance, BalanceSchema } from './shemas/balance.shemas';
import { Transaction, TransactionSchema } from './shemas/transaction.shemas';
import { createMongoSessionMiddleware } from './middleware/mongo.session.middleware';

dotenv.config();


@Module({
  imports: [
    TelegrafModule.forRoot({
      middlewares: [createMongoSessionMiddleware()],
      token: process.env.TELEGRAM_TOKEN,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MongooseConfigService,
    }),
    MongooseModule.forFeature([
      { name: Balance.name, schema: BalanceSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  providers: [Logger, ...Object.values(services), ...Object.values(handlers)],
  exports: [],
})
export class AppModule {}
