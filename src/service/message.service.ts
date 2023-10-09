import { Transaction } from '../interface/transaction.interface';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { IContext } from '../interface/context.interface';
import { TOTAL_MESSAGES } from '../constants/messages';

export class MessageService {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
  ) {}
  formatTransaction(transaction: Transaction): string {
    const transactionName = transaction.transactionName;

    const amount = transaction.amount;
    const timestamp = new Date(transaction.timestamp).toLocaleString('ru-RU', {
      timeZone: 'Europe/Kiev',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    return `📆 ${timestamp}
📝 <b>${transactionName}</b>: ${amount}
`;
  }
  splitArray(array: any[], chunkSize: number): any[][] {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }
  async sendFormattedTransactions(userId: number, transactions: Transaction[], language: string): Promise<void> {
    let totalPositiveAmount = 0;
    let totalNegativeAmount = 0;
    const positiveTransactionSums: { [key: string]: number } = {};
    const negativeTransactionSums: { [key: string]: number } = {};

    transactions.forEach((transaction) => {
      if (transaction.amount > 0) {
        totalPositiveAmount += transaction.amount;
        if (positiveTransactionSums[transaction.transactionName]) {
          positiveTransactionSums[transaction.transactionName] += transaction.amount;
        } else {
          positiveTransactionSums[transaction.transactionName] = transaction.amount;
        }
      } else {
        totalNegativeAmount += Math.abs(transaction.amount);
        if (negativeTransactionSums[transaction.transactionName]) {
          negativeTransactionSums[transaction.transactionName] += Math.abs(transaction.amount);
        } else {
          negativeTransactionSums[transaction.transactionName] = Math.abs(transaction.amount);
        }
      }
    });

    const transactionGroups = this.splitArray(transactions, 5);

    for (let i = 0; i < transactionGroups.length; ++i) {
      const group = transactionGroups[i];
      const formattedTransactions = group.map(this.formatTransaction);
      let message = formattedTransactions.join('\n');

      if (i === transactionGroups.length - 1) {
        const localizedMessage = this.getLocalizedMessage('TOTAL_AMOUNT', language);

        message += `${localizedMessage}${totalPositiveAmount - totalNegativeAmount}.\n`;

        if (Object.keys(positiveTransactionSums).length > 0) {
          const localizedMessage = this.getLocalizedMessage('POSITIVE_TRANSACTIONS', language);
          message += localizedMessage;
          for (const [name, sum] of Object.entries(positiveTransactionSums)) {
            const percentage = ((sum / totalPositiveAmount) * 100).toFixed(2);
            message += this.formatMessage(name, percentage, sum);
          }
        }

        if (Object.keys(negativeTransactionSums).length > 0) {
          const localizedMessage = this.getLocalizedMessage('NEGATIVE_TRANSACTIONS', language);
          message += `${localizedMessage}${totalNegativeAmount}\n`;
          for (const [name, sum] of Object.entries(negativeTransactionSums)) {
            const percentage = ((sum / totalNegativeAmount) * 100).toFixed(2);
            message += this.formatMessage(name, percentage, sum);
          }
        }
      }

      await this.bot.telegram.sendMessage(userId, message, { parse_mode: 'HTML' });
    }
  }

  formatMessage(name: string, percentage: string, sum: number): string {
    const paddedName = name.padEnd(12, ' ');
    return `<code>${paddedName}: ${percentage}% (${sum})</code>\n`;
  }
  getLocalizedMessage(key: string, language: string) {
    return TOTAL_MESSAGES[key][language] || TOTAL_MESSAGES[key]['ua'];
  }
}
