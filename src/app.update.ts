import { TransactionService } from './transaction.service';
import { Action, Hears, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import {
  actionButtonsStart,
  actionButtonsStatistics,
  actionButtonsTransaction,
} from './app.buttons';
import { PinoLoggerService } from './loger/pino.loger.service';
import { Context } from './interface/context.interfsce';
import { MyMessage } from './interface/my-message.interface';
import { TransactionType } from './mongodb/shemas';

@Update()
export class AppUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly transactionService: TransactionService,
    private readonly logger: PinoLoggerService,
  ) {
    this.logger.setContext('Command');
  }

  @Start()
  async startCommand(ctx: Context) {
    try {
      const userId = ctx.message.from.id;
      const existingBalance = await this.transactionService.getBalance(userId);
      if (!existingBalance) {
        await this.transactionService.createBalance({ userId, balance: 0 });
      }
      await ctx.reply(
        '\n' +
          '👋 Привет! Добро пожаловать в бот домашней бухгалтерии! 👛\n' +
          '\n' +
          'Этот бот поможет вам вести учет своих финансов. Вы можете добавлять приходы 💰 и расходы 💸, ' +
          '\nа также проверять свой баланс в любое время.\n' +
          '\n' +
          'Чтобы начать, выберите "Транзакция" и далее "Приход" или "Расход" в меню ниже. 😊',
        actionButtonsStart(),
      );
      await ctx.deleteMessage();
      delete ctx.session.type;
      this.logger.log('startCommand executed successfully');
    } catch (error) {
      this.logger.error('Error in startCommand:', error);
      await ctx.reply(
        'Произошла ошибка при выполнении команды. Пожалуйста, попробуйте еще раз позже.',
      );
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
    await ctx.reply('Введите наименование прихода и сумму через пробел');
    this.logger.log('Приход command executed');
    await ctx.deleteMessage();
  }
  @Action('Расход')
  async expenseCommand(ctx: Context) {
    ctx.session.type = 'expense';
    await ctx.reply('Введите наименование расхода и сумму через пробел');
    this.logger.log('Расход command executed');
    await ctx.deleteMessage();
  }
  @Action('Мои приходы')
  async incomeListCommand(ctx: Context) {
    this.logger.log('приходы command executed');
    const userId = ctx.from.id;
    await this.transactionService.getTransactionsByType(
      userId,
      TransactionType.INCOME,
    );
    this.logger.log('приходы command executed');
  }
  @Action('Мои расходы')
  async expenseListCommand(ctx: Context) {
    this.logger.log('расходы command executed');
    const userId = ctx.from.id;
    await this.transactionService.getTransactionsByType(
      userId,
      TransactionType.EXPENSE,
    );
    this.logger.log('расходы command executed');
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
      const userId = ctx.message.from.id;
      const balance = await this.transactionService.getBalance(userId);
      if (!balance) {
        await this.transactionService.createBalance({ userId, balance: 0 });
      }
      ctx.session.type = 'balance';
      await ctx.reply(`Ваш баланс: ${balance.balance}`);
      await ctx.reply(
        'Хотите получить статистику транзакций? Выберите параметр: ',
        actionButtonsStatistics(),
      );
      this.logger.log('Баланс command executed');
    } catch (error) {
      this.logger.error('Error in listCommand:', error);
      await ctx.reply(
        'Произошла ошибка при выполнении команды. Пожалуйста, попробуйте еще раз позже.',
      );
    }
  }
  @On('text')
  async textCommand(ctx: Context) {
    if (ctx.session.type !== 'income' && ctx.session.type !== 'expense') {
      return;
    }
    const message = ctx.message as MyMessage;
    const userId = ctx.message.from.id;
    const text = message.text;
    const [transactionName, sum] = text.split(' ');
    const amount = Number(sum);
    const transactionType =
      ctx.session.type === 'income'
        ? TransactionType.INCOME
        : TransactionType.EXPENSE;
    await this.transactionService.createTransaction({
      userId,
      transactionName,
      transactionType,
      amount,
    });
    await this.transactionService.updateBalance(
      userId,
      amount,
      transactionType,
    );
    const newBalance = await this.transactionService.getBalance(userId);
    await ctx.deleteMessage();
    delete ctx.session.type;
    await ctx.reply(`Ваш баланс: ${newBalance.balance}`);
    this.logger.log('textCommand executed');
  }
}
