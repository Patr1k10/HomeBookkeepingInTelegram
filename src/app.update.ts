import { TransactionService } from './transaction.service';
import { Action, Hears, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import {
  actionButtonsMonths,
  actionButtonsStart,
  actionButtonsStatistics,
  actionButtonsTransaction,
  actionButtonsTransactionNames,
} from './app.buttons';
import { MyMessage } from './interface/my-message.interface';
import { TransactionType } from './mongodb/shemas';
import { Context, CustomCallbackQuery } from './interface/context.interfsce';
import { BalanceService } from './balance.service';
import { Logger } from '@nestjs/common';
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
      await ctx.replyWithHTML(
        `<b>👋 Здравствуйте! Добро пожаловать в ваш финансовый ассистент. 📘</b>\n` +
          `\n` +
          `<i>Этот инструмент создан для эффективного учета вашего бюджета.</i> С его помощью можно легко отслеживать <b>доходы 💰</b> и <b>расходы 📉</b>,` +
          ` а также получать сводку по текущему балансу.\n` +
          `\n` +
          `Для начала работы выберите "Транзакция", а затем определитесь с типом: "Приход" или "Расход". 📊`,
        actionButtonsStart(),
      );

      await ctx.deleteMessage();
      delete ctx.session.type;
      this.logger.log('startCommand executed successfully');
    } catch (error) {
      this.logger.error('Error in startCommand:', error);
      await ctx.reply('⛔️Произошла ошибка при выполнении команды. Пожалуйста, попробуйте еще раз позже.⛔️');
    }
  }
  @Hears('Транзакция 💸')
  async aboutCommand(ctx: Context) {
    await ctx.deleteMessage();
    delete ctx.session.type;
    this.logger.log('Транзакция command executed');
    await ctx.reply('Выберите транзакцию:🔽', actionButtonsTransaction());
  }
  @Action('Приход')
  async incomeCommand(ctx: Context) {
    ctx.session.type = 'income';
    await ctx.reply('Введите наименование прихода и сумму через пробел ' + '\n' + 'Пример: "Зарплата 100000"');
    this.logger.log('Приход command executed');
    await ctx.deleteMessage();
  }
  @Action('Расход')
  async expenseCommand(ctx: Context) {
    ctx.session.type = 'expense';
    await ctx.reply('Введите наименование расхода и сумму через пробел' + '\n' + 'Пример: "Продукты 1000"');
    this.logger.log('Расход command executed');
    await ctx.deleteMessage();
  }
  @Action('Удаление последних️')
  async deleteLastCommand(ctx: Context) {
    const userId = ctx.from.id;
    ctx.session.type = 'delete';
    await this.transactionService.showLastNTransactionsWithDeleteOption(userId, 10);
  }
  @Action('Мои приходы')
  async incomeListCommand(ctx: Context) {
    this.logger.log('приходы command executed');
    const userId = ctx.from.id;
    await this.transactionService.getTransactionsByType(userId, TransactionType.INCOME);
    this.logger.log('приходы command executed');
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
          await ctx.answerCbQuery('Транзакция удалена');
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
    await this.transactionService.getTransactionsByType(userId, TransactionType.EXPENSE);
    this.logger.log('расходы command executed');
  }
  @Action('По категории')
  async categoryListCommand(ctx: Context) {
    const userId = ctx.from.id;
    const uniqueTransactionNames = await this.transactionService.getUniqueTransactionNames(userId);
    const transactionNameButtons = actionButtonsTransactionNames(uniqueTransactionNames);
    await ctx.reply('Выберите категорию транзакции:', transactionNameButtons);
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
      await this.transactionService.getTransactionsByTransactionName(userId, selectedTransactionName);
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Action('За сегодня')
  async todayListCommand(ctx: Context) {
    this.logger.log('today command executed');
    const userId = ctx.from.id;
    await this.transactionService.getFormattedTransactionsForToday(userId);
    this.logger.log('today command executed');
  }
  @Action('За неделю')
  async weekListCommand(ctx: Context) {
    this.logger.log('week command executed');
    const userId = ctx.from.id;
    await this.transactionService.getFormattedTransactionsForWeek(userId);
    this.logger.log('week command executed');
  }
  @Action('За месяц')
  async monthListCommand(ctx: Context) {
    this.logger.log('month command executed');
    const userId = ctx.from.id;
    await this.transactionService.getFormattedTransactionsForMonth(userId);
    this.logger.log('month command executed');
  }
  @Action('Выбрать месяц')
  async monthListMenuCommand(ctx: Context) {
    this.logger.log('month menu command executed');
    await ctx.reply('Выберите месяц:', actionButtonsMonths());
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

      await this.transactionService.getTransactionsByPeriod(userId, fromDate, toDate);
    } else {
      this.logger.log('callbackQuery is undefined');
    }
  }
  @Hears('Баланс 💰')
  async listCommand(ctx: Context) {
    try {
      await ctx.deleteMessage();
      const userId = ctx.from.id;
      await this.balanceService.getBalance(userId);
      ctx.session.type = 'balance';
      await ctx.reply('Хотите получить статистику транзакций? Выберите параметр: ', actionButtonsStatistics());
      this.logger.log('Баланс command executed');
    } catch (error) {
      this.logger.error('Error in listCommand:', error);
      await ctx.reply('Произошла ошибка при выполнении команды. Пожалуйста, попробуйте еще раз позже.');
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
    const regex = /^([a-zA-Zа-яА-Я]+(?:\s+[a-zA-Zа-яА-Я]+)?)\s+([\d.]+)$/;
    const matches = text.match(regex);
    if (!matches) {
      await ctx.reply('Пожалуйста, введите корректные данные.');
      return;
    }
    const transactionName = matches[1].trim().toLowerCase();
    const amount = Number(matches[matches.length - 1]);
    if (!transactionName || isNaN(amount) || amount <= 0) {
      await ctx.reply('Пожалуйста, введите корректные данные.');
      return;
    }
    const words = transactionName.split(' ');
    if (words.length > 2) {
      await ctx.reply('Пожалуйста, укажите одно или два слова в поле "Наименование транзакции".');
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
      await this.balanceService.getBalance(userId);
      await ctx.deleteMessage();
      delete ctx.session.type;
      this.logger.log('textCommand executed');
    } catch (error) {
      this.logger.error('Error in textCommand:', error);
      await ctx.reply('Произошла ошибка при выполнении команды. Пожалуйста, попробуйте еще раз позже.');
    }
  }
}
