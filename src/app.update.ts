import { TransactionService } from './transaction.service';
import { Action, Command, Hears, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import {
  actionButtonsMonths,
  actionButtonsStart,
  actionButtonsStatistics,
  actionButtonsTransaction,
  actionButtonsTransactionNames,
  languageSet,
} from './app.buttons';
import { MyMessage } from './interface/my-message.interface';
import { TransactionType } from './mongodb/shemas';
import { Context, CustomCallbackQuery } from './interface/context.interfsce';
import { BalanceService } from './balance.service';
import { Logger } from '@nestjs/common';
import {
  ENTER_EXPENSE_MESSAGE,
  ENTER_INCOME_MESSAGE,
  ERROR_MESSAGE,
  getBalanceMessage,
  INVALID_DATA_MESSAGE,
  INVALID_TRANSACTION_NAME_MESSAGE,
  SELECT_CATEGORY_MESSAGE,
  SELECT_MONTH_MESSAGE,
  SELECT_TRANSACTION_MESSAGE,
  START_MESSAGE,
  TRANSACTION_DELETED_MESSAGE,
  WANT_STATISTICS_MESSAGE,
} from './constants/messages';

@Update()
export class AppUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly transactionService: TransactionService,
    private readonly balanceService: BalanceService,
    private readonly logger: Logger,
  ) {}

  @Start()
  async startCommand(ctx: Context) {
    try {
      const userId = ctx.from.id;
      const user = ctx.from;
      this.logger.log(`
      User ID: ${user.id}
      First Name: ${user.first_name}
      Last Name: ${user.last_name}
      Username: ${user.username}`);
      await this.balanceService.createBalance({ userId });
      await ctx.reply('Оберіть мову / Choose language', languageSet());

      await ctx.deleteMessage();
      delete ctx.session.type;
      this.logger.log('startCommand executed successfully');
    } catch (error) {
      this.logger.error('Error in startCommand:', error);
      await ctx.answerCbQuery(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }

  @Action(/setLanguage:(.+)/)
  async setLanguage(ctx: Context) {
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      ctx.session.language = parts[1];
      await ctx.replyWithHTML(
        START_MESSAGE[ctx.session.language || 'ua']['WELCOME_MESSAGE'],
        actionButtonsStart(ctx.session.language),
      );
      this.logger.log('setLanguage command executed');
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Command('transactions')
  @Hears(/Transactions 💸|Транзакції 💸/)
  async aboutCommand(ctx: Context) {
    await ctx.deleteMessage();
    delete ctx.session.type;
    this.logger.log('Транзакция command executed');
    await ctx.replyWithHTML(
      SELECT_TRANSACTION_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsTransaction(ctx.session.language),
    );
  }
  @Action('Приход')
  async incomeCommand(ctx: Context) {
    ctx.session.type = 'income';
    await ctx.deleteMessage();
    await ctx.replyWithHTML(ENTER_INCOME_MESSAGE[ctx.session.language || 'ua']);

    this.logger.log('Приход command executed');
  }

  @Action('Расход')
  async expenseCommand(ctx: Context) {
    ctx.session.type = 'expense';
    await ctx.deleteMessage();
    await ctx.replyWithHTML(ENTER_EXPENSE_MESSAGE[ctx.session.language || 'ua']);

    this.logger.log('Расход command executed');
  }
  @Action('Удаление последних️')
  async deleteLastCommand(ctx: Context) {
    const userId = ctx.from.id;
    ctx.session.type = 'delete';
    await this.transactionService.showLastNTransactionsWithDeleteOption(userId, 10, ctx.session.language || 'ua');
  }
  @Action('Мои приходы')
  async incomeListCommand(ctx: Context) {
    this.logger.log('приходы command executed');
    const userId = ctx.from.id;
    await this.transactionService.getTransactionsByType(userId, TransactionType.INCOME, ctx.session.language || 'ua');
  }
  @Action(/delete_(.+)/)
  async handleCallbackQuery(ctx: Context) {
    try {
      if (ctx.session.type !== 'delete') {
        return;
      }
      await ctx.deleteMessage();

      const customCallbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;

      if (customCallbackQuery && 'data' in customCallbackQuery) {
        const callbackData = customCallbackQuery.data;
        const userId = ctx.from.id;
        if (callbackData.startsWith('delete_')) {
          const transactionIdToDelete = callbackData.replace('delete_', '');
          await this.transactionService.deleteTransactionById(userId, transactionIdToDelete);
          await ctx.answerCbQuery(TRANSACTION_DELETED_MESSAGE[ctx.session.language || 'ua']);
          delete ctx.session.type;
        }
      } else {
        this.logger.error('customCallbackQuery is undefined or does not contain data');
      }
    } catch (error) {
      this.logger.error('Error in handleCallbackQuery:', error);
      await ctx.answerCbQuery('Произошла ошибка');
    }
  }
  @Action('Мои расходы')
  async expenseListCommand(ctx: Context) {
    this.logger.log('расходы command executed');
    const userId = ctx.from.id;
    await this.transactionService.getTransactionsByType(userId, TransactionType.EXPENSE, ctx.session.language || 'ua');
  }
  @Action('По категории')
  async categoryListCommand(ctx: Context) {
    const userId = ctx.from.id;
    const uniqueTransactionNames = await this.transactionService.getUniqueTransactionNames(userId);
    const transactionNameButtons = actionButtonsTransactionNames(uniqueTransactionNames);
    await ctx.reply(SELECT_CATEGORY_MESSAGE[ctx.session.language || 'ua'], transactionNameButtons);
  }
  @Action(/TransactionName:(.+)/)
  async transactionNameCommand(ctx: Context) {
    this.logger.log('transactionName command executed');
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const selectedTransactionName = parts[1];
      const userId = ctx.from.id;
      await this.transactionService.getTransactionsByTransactionName(
        userId,
        selectedTransactionName,
        ctx.session.language || 'ua',
      );
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Action('За сегодня')
  async todayListCommand(ctx: Context) {
    this.logger.log('today command executed');
    const userId = ctx.from.id;
    await this.transactionService.getFormattedTransactionsForToday(userId, ctx.session.language || 'ua');
    this.logger.log('today command executed');
  }
  @Action('За неделю')
  async weekListCommand(ctx: Context) {
    this.logger.log('week command executed');
    const userId = ctx.from.id;
    await this.transactionService.getFormattedTransactionsForWeek(userId, ctx.session.language || 'ua');
    this.logger.log('week command executed');
  }
  @Action('За месяц')
  async monthListCommand(ctx: Context) {
    this.logger.log('month command executed');
    const userId = ctx.from.id;
    await this.transactionService.getFormattedTransactionsForMonth(userId, ctx.session.language || 'ua');
    this.logger.log('month command executed');
  }
  @Action('Выбрать месяц')
  async monthListMenuCommand(ctx: Context) {
    this.logger.log('month menu command executed');
    await ctx.reply(SELECT_MONTH_MESSAGE[ctx.session.language || 'ua'], actionButtonsMonths(ctx.session.language));
  }
  @Action(/Month:(.+)/)
  async specificMonthListCommand(ctx: Context) {
    this.logger.log('specific month command executed');
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const parts = callbackData.split(':');
      const selectedMonth = Number(parts[1]);
      const userId = ctx.from.id;

      const fromDate = new Date();
      fromDate.setMonth(selectedMonth - 1);
      fromDate.setDate(1);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date();
      toDate.setMonth(selectedMonth);
      toDate.setDate(0);
      toDate.setHours(23, 59, 59, 999);

      await this.transactionService.getTransactionsByPeriod(userId, fromDate, toDate, ctx.session.language || 'ua');
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Command('balans')
  @Hears(/Balance 💰|Баланс 💰/)
  async listCommand(ctx: Context) {
    try {
      await ctx.deleteMessage();
      const userId = ctx.from.id;
      const balance = await this.balanceService.getOrCreateBalance(userId);
      const balanceMessage = getBalanceMessage(balance.balance, ctx.session.language || 'ua');
      await ctx.replyWithHTML(balanceMessage);
      ctx.session.type = 'balance';
      this.logger.log('Баланс command executed');
    } catch (error) {
      this.logger.error('Error in listCommand:', error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }
  @Command('statistics')
  @Hears(/Статистика 📊|Statistics 📊/)
  async statisticsCommand(ctx: Context) {
    try {
      await ctx.deleteMessage();
      await ctx.reply(
        WANT_STATISTICS_MESSAGE[ctx.session.language || 'ua'],
        actionButtonsStatistics(ctx.session.language),
      );
      this.logger.log('statistics command executed');
    } catch (error) {
      this.logger.error('Error in statisticsCommand:', error);
      await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
    }
  }

  @On('text')
  async textCommand(ctx: Context) {
    if (ctx.session.type !== 'income' && ctx.session.type !== 'expense') {
      return;
    }
    const message = ctx.message as MyMessage;
    const userId = ctx.from.id;
    const text = message.text;
    const transactions = text.split(',').map((t) => t.trim());

    for (const transaction of transactions) {
      const regex = /^([a-zA-Zа-яА-ЯіІ]+(?:\s+[a-zA-Zа-яА-ЯіІ]+)?)\s+([\d.]+)$/;
      const matches = transaction.match(regex);
      if (!matches) {
        await ctx.reply(INVALID_DATA_MESSAGE[ctx.session.language || 'ua']);
        return;
      }
      const transactionName = matches[1].trim().toLowerCase();
      const amount = Number(matches[2]);
      if (!transactionName || isNaN(amount) || amount <= 0) {
        await ctx.reply(INVALID_DATA_MESSAGE[ctx.session.language || 'ua']);
        return;
      }
      const words = transactionName.split(' ');
      if (words.length > 2) {
        await ctx.reply(INVALID_TRANSACTION_NAME_MESSAGE[ctx.session.language || 'ua']);
        return;
      }
      const transactionType = ctx.session.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE;

      try {
        await this.transactionService.createTransaction({
          userId,
          transactionName,
          transactionType,
          amount,
        });
        await this.balanceService.updateBalance(userId, amount, transactionType);
        const balance = await this.balanceService.getOrCreateBalance(userId);
        const balanceMessage = getBalanceMessage(balance.balance, ctx.session.language || 'ua');
        await ctx.replyWithHTML(balanceMessage);
        this.logger.log('textCommand executed');
      } catch (error) {
        this.logger.error('Error in textCommand:', error);
        await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
      }
    }
    delete ctx.session.type;
  }
}
