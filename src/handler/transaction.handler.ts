import { Action, Ctx, On, Update } from 'nestjs-telegraf';
import { ChartService, StatisticsService, TransactionService } from '../service';
import { Logger } from '@nestjs/common';
import { BalanceService } from '../service';
import { TransactionType } from '../type/enum/transactionType.enam';
import {
  BALANCE_MESSAGE,
  CREATE_TRANSACTION_MESSAGE,
  ENTER_EXPENSE_MESSAGE,
  ENTER_INCOME_MESSAGE,
  getBalanceMessage,
  INVALID_DATA_MESSAGE,
  regex,
  SELECT_TRANSACTION_MESSAGE,
  TRANSACTION_DELETED_MESSAGE,
} from '../constants';
import { CustomCallbackQuery, IContext, MyMessage } from '../type/interface';
import { actionButtonsTransaction, backTranButton } from '../battons';
import { resetSession } from '../common';
import { WizardContext } from 'telegraf/typings/scenes';
import { ITransactionQuery } from '../type/interface/transaction.query.interface';

@Update()
export class TransactionHandler {
  private readonly logger: Logger = new Logger(TransactionHandler.name);
  constructor(
    private readonly transactionService: TransactionService,
    private readonly balanceService: BalanceService,
    private readonly statisticsService: StatisticsService,
    private readonly chartService: ChartService,
  ) {}

  @Action('transactions')
  async aboutCommand(ctx: IContext) {
    delete ctx.session.type;
    this.logger.log(`user:${ctx.from.id} transactions command executed`);
    await ctx.editMessageText(
      SELECT_TRANSACTION_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsTransaction(ctx.session.language),
    );
  }
  @Action('income')
  async incomeCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} incomeCommand executed`);
    ctx.session.type = 'income';
    await ctx.editMessageText(ENTER_INCOME_MESSAGE[ctx.session.language || 'ua'], {
      reply_markup: backTranButton(ctx.session.language || 'ua').reply_markup,
      parse_mode: 'HTML',
    });
  }

  @Action('expense')
  async expenseCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} command executed`);
    ctx.session.type = 'expense';
    await ctx.editMessageText(ENTER_EXPENSE_MESSAGE[ctx.session.language || 'ua'], {
      reply_markup: backTranButton(ctx.session.language || 'ua').reply_markup,
      parse_mode: 'HTML',
    });
  }
  @Action('delete_last')
  async deleteLastCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} deleteLastCommand `);
    ctx.session.type = 'delete';
    const count = 20;
    await this.transactionService.showLastNTransactionsWithDeleteOption(ctx, count);
  }
  @Action(/delete_(.+)/)
  async handleCallbackQuery(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} handleCallbackQuery`);
    try {
      if (ctx.session.type !== 'delete') {
        return;
      }
      const customCallbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
      if (customCallbackQuery && 'data' in customCallbackQuery) {
        const callbackData = customCallbackQuery.data;
        if (callbackData.startsWith('delete_')) {
          const transactionIdToDelete = callbackData.replace('delete_', '');
          await this.transactionService.deleteTransactionById(ctx, transactionIdToDelete);
          await ctx.editMessageText(
            TRANSACTION_DELETED_MESSAGE[ctx.session.language || 'ua'],
            backTranButton(ctx.session.language || 'ua'),
          );
          delete ctx.session.type;
        }
      } else {
        this.logger.error(`user:${ctx.from.id} customCallbackQuery is undefined or does not contain data`);
      }
    } catch (error) {
      this.logger.error(`user:${ctx.from.id} Error in handleCallbackQuery:`, error);
    }
  }

  @On('text')
  async textCommand(ctx: IContext) {
    if (ctx.session.type !== 'income' && ctx.session.type !== 'expense') {
      return;
    }
    const message = ctx.message as MyMessage;
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;
    const text = message.text;
    const transactions = text.split(',').map((t) => t.trim());
    let errorMessageSent = false;
    const transactionMessage = [];
    const transactionNames = [];
    const transactionType = ctx.session.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE;

    for (const transaction of transactions) {
      const matches = transaction.match(regex); // regex до трех слів
      if (!matches) {
        errorMessageSent = true;
        this.logger.error(`Error creating transaction: no matches:${matches} `);
        continue;
      }
      const transactionName = matches[1].trim().toLowerCase();
      transactionNames.push(transactionName);
      const amount = Number(matches[2]);
      if (!transactionName || isNaN(amount) || amount <= 0) {
        errorMessageSent = true;
        continue;
      }
      try {
        await this.transactionService.createTransaction({
          userId,
          transactionName,
          transactionType,
          amount,
          userName,
        });
        await this.balanceService.updateBalance(userId, amount, transactionType);
        transactionMessage.push(await this.statisticsService.getTransactionsByTransactionName(ctx, transactionName));
      } catch (error) {
        this.logger.error('Error creating transaction:', error);
        errorMessageSent = true;
      }
    }
    if (errorMessageSent) {
      await ctx.replyWithHTML(
        INVALID_DATA_MESSAGE[ctx.session.language || 'ua'],
        backTranButton(ctx.session.language || 'ua'),
      );
    } else {
      const transactionQueue = {} as ITransactionQuery;
      transactionQueue.userId = userId;
      transactionQueue.transactionName = `${transactionNames[0]}`;


      const transactionForCard = await this.statisticsService.getTransactionsForChard(ctx, transactionQueue);
      const chart = await this.chartService.generateDailyTransactionChart(transactionForCard);
      const imageBuffer = Buffer.from(chart, 'base64');

      const balance = await this.balanceService.getBalance(userId, ctx.session.group);

      const balanceMessage = getBalanceMessage(balance, ctx.session.language || 'ua', ctx.session.currency || 'UAH');
      await ctx.replyWithPhoto(
        { source: imageBuffer },
        {
          caption: `${CREATE_TRANSACTION_MESSAGE[ctx.session.language || 'ua']}\n${transactionMessage}
      ${BALANCE_MESSAGE[ctx.session.language]}\n${balanceMessage}`,
          reply_markup: backTranButton(ctx.session.language || 'ua').reply_markup,
          parse_mode: 'HTML',
        },
      );
      this.logger.log(`user:${ctx.from.id} textCommand executed`);
    }

    delete ctx.session.type;
  }

  @Action('backT')
  async backT(@Ctx() ctx: IContext & WizardContext) {
    this.logger.log(`user:${ctx.from.id} backT executed`);
    const callbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    await resetSession(ctx);
    try {
      if (callbackQuery.message.photo) {
        await ctx.deleteMessage();
        await ctx.reply(
          SELECT_TRANSACTION_MESSAGE[ctx.session.language || 'ua'],
          actionButtonsTransaction(ctx.session.language || 'ua'),
        );
      } else {
        await ctx.editMessageText(
          SELECT_TRANSACTION_MESSAGE[ctx.session.language || 'ua'],
          actionButtonsTransaction(ctx.session.language || 'ua'),
        );
      }
    } catch (error) {
      this.logger.error(`Error in backT: ${error.message}`);
      await ctx.reply(
        SELECT_TRANSACTION_MESSAGE[ctx.session.language || 'ua'],
        actionButtonsTransaction(ctx.session.language || 'ua'),
      );
    }
  }
}
