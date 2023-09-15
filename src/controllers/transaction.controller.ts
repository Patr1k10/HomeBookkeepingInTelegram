import { PinoLoggerService } from '../loger/pino.loger.service';
import { TransactionService } from '../transaction.service';
import { Transaction } from '../interface/transaction.interface';

export class TransactionController {
  constructor(
    private readonly logger: PinoLoggerService,
    private readonly transactionService: TransactionService,
  ) {
  }
}
