import { Module } from '@nestjs/common';
import { CronNotificationsService } from './cron.notifications.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Balance, BalanceSchema } from '../shemas/balance.shemas';
import { Transaction, TransactionSchema } from '../shemas/transaction.shemas';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Balance.name, schema: BalanceSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  providers: [CronNotificationsService],
  exports: [],
})
export class CronModule {}
