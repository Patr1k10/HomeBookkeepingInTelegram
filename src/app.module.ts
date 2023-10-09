import { Logger, Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppUpdate } from './handler/basicCommands.handler';
import { TransactionService } from './service/transaction.service';
import * as LocalSession from 'telegraf-session-local';
import * as dotenv from 'dotenv';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MongooseConfigService } from './mongodb/mongoose-config.service';
import { BalanceService } from './service/balance.service';
import { TransactionHandler } from './handler/transaction.handler';
import { BalanceHandler } from './handler/balance.handler';
import { StatisticsHandler } from './handler/statistics.handler';
import { Balance, BalanceSchema } from './shemas/balance.shemas';
import { Transaction, TransactionSchema } from './shemas/transaction.shemas';
import { MessageService } from './service/message.service';
import { StatisticsService } from './service/statistics.service';

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
    Logger,
    AppUpdate,
    StatisticsHandler,
    BalanceHandler,
    TransactionHandler,
    TransactionService,
    BalanceService,
    MessageService,
    StatisticsService,
  ],
  exports: [],
})
export class AppModule {}
