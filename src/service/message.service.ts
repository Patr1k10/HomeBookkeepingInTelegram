import { Transaction } from '../interface/transaction.interface';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { IContext } from '../interface/context.interface';
import { CURRNCY, TOTAL_MESSAGES } from '../constants/messages';
import { backStatisticButton } from '../battons/app.buttons';

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
  async sendFormattedTransactions(ctx: IContext, transactions: Transaction[]): Promise<void> {
    const userId = ctx.from.id;
    const language = ctx.session.language;
    const currency = ctx.session.currency;
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

    const sortedPositive = Object.entries(positiveTransactionSums)
      .sort(([, a], [, b]) => b - a)
      .map(([name, sum]) => ({
        name,
        sum,
        percentage: ((sum / totalPositiveAmount) * 100).toFixed(2),
      }));

    const sortedNegative = Object.entries(negativeTransactionSums)
      .sort(([, a], [, b]) => b - a)
      .map(([name, sum]) => ({
        name,
        sum,
        percentage: ((sum / totalNegativeAmount) * 100).toFixed(2),
      }));

    let message = '';
    const setCurrency = CURRNCY[currency];

    if (sortedPositive.length > 0) {
      const localizedMessage = this.getLocalizedMessage('POSITIVE_TRANSACTIONS', language);
      message += `${localizedMessage}${totalPositiveAmount}${setCurrency}\n`;
      for (const { name, sum, percentage } of sortedPositive) {
        message += this.formatMessage(name, percentage, sum, currency);
      }
    }

    if (sortedNegative.length > 0) {
      const localizedMessage = this.getLocalizedMessage('NEGATIVE_TRANSACTIONS', language);
      message += `${localizedMessage}${totalNegativeAmount}${setCurrency}\n`;
      for (const { name, sum, percentage } of sortedNegative) {
        message += this.formatMessage(name, percentage, sum, currency);
      }
    }
    const localizedMessage = this.getLocalizedMessage('TOTAL_AMOUNT', language);
    message += `${localizedMessage}${totalPositiveAmount - totalNegativeAmount}${setCurrency}\n`;

    await this.bot.telegram.editMessageText(userId, ctx.session.lastBotMessage, null, message, {
      parse_mode: 'HTML',
      reply_markup: backStatisticButton(ctx.session.language).reply_markup,
    });
  }

  formatMessage(name: string, percentage: string, sum: number, currency: string) {
    const paddedName = name.padEnd(12, ' ');
    const setCurrency = CURRNCY[currency];
    return `<code>${paddedName}: ${percentage}% (${sum}${setCurrency})</code>\n`;
  }
  getLocalizedMessage(key: string, language: string) {
    return TOTAL_MESSAGES[key][language] || TOTAL_MESSAGES[key]['ua'];
  }
}
