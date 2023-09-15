import { PinoLoggerService } from '../loger/pino.loger.service';
import { TransactionService } from '../transaction.service';

export class TransactionController {
  constructor(
    private readonly logger: PinoLoggerService,
    private readonly transactionService: TransactionService,
  ) {}
}
