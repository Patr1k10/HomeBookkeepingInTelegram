import { Logger, Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import * as services from './service';
import * as scene from './scene';
import * as dotenv from 'dotenv';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseConfigService } from './mongodb/mongoose-config.service';
import * as handlers from './handler/index';
import { Balance, BalanceSchema } from './shemas/balance.shemas';
import { Transaction, TransactionSchema } from './shemas/transaction.shemas';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenAiApiModule } from './open-ai-api/open-ai-api.module';
import { createSessionMiddleware, errorHandlingMiddleware } from './middleware';

dotenv.config();

@Module({
  imports: [
    OpenAiApiModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        middlewares: [errorHandlingMiddleware(), createSessionMiddleware(configService)],
        token: configService.getOrThrow('TELEGRAM_TOKEN'),
      }),
      inject: [ConfigService],
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
  providers: [Logger, ...Object.values(services), ...Object.values(handlers), ...Object.values(scene)],
  exports: [],
})
export class AppModule {}
