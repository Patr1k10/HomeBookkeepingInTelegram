import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppUpdate } from './app.update';
import { TransactionService } from './transaction.service';
import * as LocalSession from 'telegraf-session-local';
import * as dotenv from 'dotenv';
import { PinoLoggerService } from './loger/pino.loger.service';
import { LoggerModule } from './loger/loger.modul';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MongooseConfigService } from './mongodb/mongoose-config.service';
import { Balance, BalanceSchema, Transaction, TransactionSchema } from './mongodb/shemas';
import configuration from './mongodb/configuration';
import { BalanceService } from './balance.service';

dotenv.config();

const sessions = new LocalSession({ database: 'session_db.json' });

@Module({
  imports: [
    TelegrafModule.forRoot({
      middlewares: [sessions.middleware()],
      token: process.env.TELEGRAM_TOKEN,
    }),
    LoggerModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MongooseConfigService,
    }),
    MongooseModule.forFeature([
      { name: Balance.name, schema: BalanceSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [TransactionService, AppUpdate, PinoLoggerService, BalanceService],
  exports: [PinoLoggerService],
})
export class AppModule {}
