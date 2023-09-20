import { TransactionService } from './transaction.service';
import { Action, Hears, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import {
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
      await ctx.reply('Произошла ошибка при выполнении команды. Пожалуйста, попробуйте еще раз позже.');
    }
  }
  @Hears('Транзакция 💸')
  async aboutCommand(ctx: Context) {
    await ctx.deleteMessage();
    delete ctx.session.type;
    this.logger.log('Транзакция command executed');
    await ctx.reply('Выберите транзакцию', actionButtonsTransaction());
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
  @Action('Мои приходы')
  async incomeListCommand(ctx: Context) {
    this.logger.log('приходы command executed');
    const userId = ctx.from.id;
    await this.transactionService.getTransactionsByType(userId, TransactionType.INCOME);
    this.logger.log('приходы command executed');
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
    const transactionName = matches[1].trim().toLowerCase(); // Преобразование в нижний регистр
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
      // Обработка ошибок
      this.logger.error('Error in textCommand:', error);
      await ctx.reply('Произошла ошибка при выполнении команды. Пожалуйста, попробуйте еще раз позже.');
    }
  }
}
