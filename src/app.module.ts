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
import { createSessionMiddleware } from './middleware/session.middleware';
import { errorHandlingMiddleware } from './middleware/global-error.filter';
import { ScheduleModule } from '@nestjs/schedule';

dotenv.config();

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TelegrafModule.forRoot({
      middlewares: [createSessionMiddleware(), errorHandlingMiddleware()],
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
