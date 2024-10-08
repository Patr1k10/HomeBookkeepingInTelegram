import { Logger, Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import * as services from './service';
import * as scene from './scene';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseConfigService } from './mongodb/mongoose-config.service';
import * as handlers from './handler/index';
import { Balance, BalanceSchema } from './mongodb/shemas/balance.shemas';
import { Transaction, TransactionSchema } from './mongodb/shemas/transaction.shemas';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenAiApiModule } from './open-ai-api/open-ai-api.module';
import { createSessionMiddleware, errorHandlingMiddleware } from './middleware';
import { Analytics, AnalyticsSchema } from './mongodb/shemas/analytics.schemas';
import { HealthChecksController } from './api/health.checks.controller';

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
      { name: Analytics.name, schema: AnalyticsSchema },
    ]),
  ],

  providers: [Logger, ...Object.values(services), ...Object.values(handlers), ...Object.values(scene)],
  controllers: [HealthChecksController],
  exports: [],
})
export class AppModule {}
