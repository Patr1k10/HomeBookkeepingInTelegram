import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { CURRNCY, TOTAL_MESSAGES } from '../constants';
import { IContext, Transaction } from '../interface';
import { actionButtonsCompare } from '../battons';

export class MessageService {
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
  async splitArray(array: any[], chunkSize: number) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }
  async sendFormattedTransactions(ctx: IContext, transactions: Transaction[]): Promise<void> {
    const language = ctx.session.language;
    const currency = ctx.session.currency;
    const group = ctx.session.group;
    let totalPositiveAmount = 0;
    let totalNegativeAmount = 0;
    const positiveTransactionSums: { [key: string]: { sum: number; userName: string } } = {}; // Изменяем тип объекта
    const negativeTransactionSums: { [key: string]: { sum: number; userName: string } } = {}; // Изменяем тип объекта

    let message = '';

    transactions.forEach((transaction) => {
      const { userName, transactionName, amount } = transaction; // Деструктурируем необходимые данные

      if (amount > 0) {
        totalPositiveAmount += amount;
        if (positiveTransactionSums[transactionName]) {
          positiveTransactionSums[transactionName].sum += amount; // Увеличиваем сумму для существующего ключа
        } else {
          positiveTransactionSums[transactionName] = { sum: amount, userName }; // Создаем новую запись
        }
      } else {
        totalNegativeAmount += Math.abs(amount);
        if (negativeTransactionSums[transactionName]) {
          negativeTransactionSums[transactionName].sum += Math.abs(amount); // Увеличиваем сумму для существующего ключа
        } else {
          negativeTransactionSums[transactionName] = { sum: Math.abs(amount), userName }; // Создаем новую запись
        }
      }
    });

    const setCurrency = CURRNCY[currency];

    const sortedPositive = Object.entries(positiveTransactionSums)
      .sort(([, a], [, b]) => b.sum - a.sum)
      .map(([name, { sum, userName }]) => ({
        name,
        sum,
        percentage: ((sum / totalPositiveAmount) * 100).toFixed(2),
        userName,
      }));

    const sortedNegative = Object.entries(negativeTransactionSums)
      .sort(([, a], [, b]) => b.sum - a.sum)
      .map(([name, { sum, userName }]) => ({
        name,
        sum,
        percentage: ((sum / totalNegativeAmount) * 100).toFixed(2),
        userName,
      }));

    if (sortedPositive.length > 0) {
      const localizedMessage = this.getLocalizedMessage('POSITIVE_TRANSACTIONS', language);
      message += `${localizedMessage}`;
      for (const { name, sum, percentage, userName } of sortedPositive) {
        message += this.formatMessage(name, percentage, sum, currency, group, userName);
      }
      message += `<b>${totalPositiveAmount}${setCurrency}</b>\n\n`; // Общая сумма додатних транзакций
    }

    if (sortedNegative.length > 0) {
      const localizedMessage = this.getLocalizedMessage('NEGATIVE_TRANSACTIONS', language);
      message += `${localizedMessage}`;
      for (const { name, sum, percentage, userName } of sortedNegative) {
        message += this.formatMessage(name, percentage, sum, currency, group, userName);
      }
      message += `<b>${totalNegativeAmount}${setCurrency}</b>`; // Общая сумма від'ємних транзакцій
    }

    const localizedMessage = this.getLocalizedMessage('TOTAL_AMOUNT', language);
    // General summary
    message += `${localizedMessage}<b>${totalPositiveAmount - totalNegativeAmount}${setCurrency}</b>\n`;

    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: actionButtonsCompare(ctx.session.language || 'ua', ctx.session.isPremium, ctx).reply_markup,
    });
  }

  private formatMessage(
    name: string,
    percentage: string,
    sum: number,
    currency: string,
    group: number[],
    userName?: string,
  ) {
    const paddedName = name.padEnd(10, ' ');
    const setCurrency = CURRNCY[currency];

    let userString = '';

   if (group && group.length >= 2 && userName !== undefined) {
      userString = `(👤${userName})`;
    }

    return `<code>${paddedName}${userString}: ${percentage}% (${sum}${setCurrency})</code>\n`;
  }
  private getLocalizedMessage(key: string, language: string) {
    return TOTAL_MESSAGES[key][language] || TOTAL_MESSAGES[key]['ua'];
  }
}
