import { Logger, Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppUpdate } from './app.update';
import { TransactionService } from './transaction.service';
import * as LocalSession from 'telegraf-session-local';
import * as dotenv from 'dotenv';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MongooseConfigService } from './mongodb/mongoose-config.service';
import { Balance, BalanceSchema, Transaction, TransactionSchema } from './mongodb/shemas';
import { BalanceService } from './balance.service';
import { TransactionHandler } from './handler/transaction.handler';
import { BalanceHandler } from './handler/balance.handler';
import { StatisticsHandler } from './handler/statistics.handler';

dotenv.config();

const sessions = new LocalSession({ database: 'session_db.json' });

@Module({
  imports: [
    TelegrafModule.forRoot({
      middlewares: [sessions.middleware()],
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
  providers: [
    AppUpdate,
    StatisticsHandler,
    BalanceHandler,
    TransactionHandler,
    TransactionService,
    BalanceService,
    Logger,
  ],
  exports: [],
})
export class AppModule {}
