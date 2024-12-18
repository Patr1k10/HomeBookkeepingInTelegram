import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { COUNT_BY, COUNT_WITH, CURRNCY, DATA_FOR, DATA_PERIOD, TOTAL_MESSAGES } from '../constants';
import { IContext, SortTransactionInterface, Transaction, TransactionSums } from '../type/interface';
import { ITransactionQuery } from '../type/interface/transaction.query.interface';
import { Logger } from '@nestjs/common';
import { toNormalDate } from '../common';

export class MessageService {
  private readonly logger: Logger = new Logger(MessageService.name);
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
  ) {}
  async formatTransaction(transaction: Transaction) {
    const transactionName = transaction.transactionName;
    const userName = transaction.userName;

    const amount = transaction.amount;
    const timestamp = new Date(transaction.timestamp).toLocaleString('ru-RU', {
      timeZone: 'Europe/Kiev',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    let userString = '';

    if (userName !== undefined) {
      userString = `(👤${userName})`;
    }
    return `📆 ${timestamp}
📝 <b>${transactionName}</b>(👤${userString}): ${amount}
`;
  }

  async sendFormattedTransactions(
    ctx: IContext,
    transactions: Transaction[],
    query?: ITransactionQuery | null,
    firstTransaction?: boolean,
  ): Promise<string[]> {
    let message = ``;
    const { language, currency, group } = ctx.session;
    const timestamp = query?.timestamp;
    const { firstDate, lastDate } = await this.getFirstTransactionTimestamp(transactions);

    if (firstTransaction) {
      message = `${COUNT_WITH[ctx.session.language || 'ua']} ${firstDate}📆\n${
        COUNT_BY[ctx.session.language || 'ua']
      } ${lastDate}📆\n`;
    }

    if (timestamp !== undefined) {
      if (timestamp.$lte !== undefined) {
        const startDate = await toNormalDate(timestamp.$gte);
        const endDate = await toNormalDate(timestamp.$lte);
        message = `${DATA_PERIOD(startDate, endDate, language || 'ua')}`;
      } else {
        const startDate = await toNormalDate(timestamp.$gte);
        message = `${DATA_FOR[language || 'ua']} ${startDate}📆\n`;
      }
    }

    let totalPositiveAmount = 0;
    let totalNegativeAmount = 0;
    const positiveTransactionSums: TransactionSums = {};
    const negativeTransactionSums: TransactionSums = {};

    transactions.forEach((transaction) => {
      const { userName, transactionName, amount } = transaction;

      if (amount > 0) {
        totalPositiveAmount += amount;
        if (positiveTransactionSums[transactionName]) {
          positiveTransactionSums[transactionName].sum += amount;
        } else {
          positiveTransactionSums[transactionName] = { sum: amount, userName };
        }
      } else {
        totalNegativeAmount += Math.abs(amount);
        if (negativeTransactionSums[transactionName]) {
          negativeTransactionSums[transactionName].sum += Math.abs(amount);
        } else {
          negativeTransactionSums[transactionName] = { sum: Math.abs(amount), userName };
        }
      }
    });

    const setCurrency = CURRNCY[currency];

    const sortedPositive = await this.sortTransactionsBySum(positiveTransactionSums, totalPositiveAmount);
    const sortedNegative = await this.sortTransactionsBySum(negativeTransactionSums, totalNegativeAmount);

    if (sortedPositive.length > 0) {
      const localizedMessage = this.getLocalizedMessage('POSITIVE_TRANSACTIONS', language);
      message += `${localizedMessage}`;
      for (const { name, sum, percentage, userName } of sortedPositive) {
        message += this.formatMessage(name, percentage, sum, currency, group, userName, false);
      }
      message += `<b>${totalPositiveAmount}${setCurrency}</b>\n\n`;
    }

    if (sortedNegative.length > 0) {
      const localizedMessage = this.getLocalizedMessage('NEGATIVE_TRANSACTIONS', language);
      message += `${localizedMessage}`;
      for (const { name, sum, percentage, userName } of sortedNegative) {
        message += this.formatMessage(name, percentage, sum, currency, group, userName, true);
      }
      message += `-<b>${totalNegativeAmount}${setCurrency}</b>`;
    }

    const localizedMessage = this.getLocalizedMessage('TOTAL_AMOUNT', language);
    // General summary
    message += `${localizedMessage}<b>${totalPositiveAmount - totalNegativeAmount}${setCurrency}</b>\n`;
    // Разделить сообщение, если оно слишком длинное
    const messages = this.splitMessage(message);

    return messages;
  }

  private async sortTransactionsBySum(
    transactions: TransactionSums,
    totalAmount: number,
  ): Promise<SortTransactionInterface[]> {
    return Object.entries(transactions)
      .sort(([, a], [, b]) => b.sum - a.sum)
      .map(([name, { sum, userName }]) => ({
        name,
        sum,
        percentage: ((sum / totalAmount) * 100).toFixed(2),
        userName,
      }));
  }

  private splitMessage(message: string, maxLength: number = 4096): string[] {
    const parts: string[] = [];
    let remainingMessage = message;

    while (remainingMessage.length > maxLength) {
      let splitIndex = remainingMessage.lastIndexOf('\n', maxLength);
      if (splitIndex === -1) {
        splitIndex = maxLength;
      }
      parts.push(remainingMessage.slice(0, splitIndex));
      remainingMessage = remainingMessage.slice(splitIndex);
    }
    parts.push(remainingMessage);

    return parts;
  }

  private formatMessage(
    name: string,
    percentage: string,
    sum: number,
    currency: string,
    group: number[],
    userName?: string,
    isNegative: boolean = false,
  ) {
    const paddedName = name.padEnd(10, ' ');
    const setCurrency = CURRNCY[currency];

    let userString = '';
    if (group && group.length >= 2 && userName !== undefined) {
      userString = `(👤${userName})`;
    }

    const formattedSum = isNegative ? `-${sum}` : sum;

    return `<code>${paddedName}${userString}: ${percentage}% (${formattedSum}${setCurrency})</code>\n`;
  }
  private getLocalizedMessage(key: string, language: string) {
    return TOTAL_MESSAGES[key][language] || TOTAL_MESSAGES[key]['ua'];
  }

  private async getFirstTransactionTimestamp(
    transactions: Transaction[],
  ): Promise<{ firstDate: string; lastDate: string }> {
    transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstDate = await toNormalDate(transactions[0].timestamp);
    const lastDate = await toNormalDate(transactions[transactions.length - 1].timestamp);
    return { firstDate, lastDate };
  }
}
