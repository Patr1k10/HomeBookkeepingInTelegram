import { Action, Command, Hears, On, Update } from 'nestjs-telegraf';
import { TransactionService } from '../service/transaction.service';
import { Logger } from '@nestjs/common';

import {
  BALANCE_MESSAGE,
  ENTER_EXPENSE_MESSAGE,
  ENTER_INCOME_MESSAGE,
  ERROR_MESSAGE,
  getBalanceMessage,
  INVALID_DATA_MESSAGE,
  INVALID_TRANSACTION_NAME_MESSAGE,
  SELECT_TRANSACTION_MESSAGE,
  TRANSACTION_DELETED_MESSAGE,
} from '../constants/messages';
import { actionButtonsTransaction } from '../app.buttons';
import { CustomCallbackQuery, IContext } from '../interface/context.interface';
import { MyMessage } from '../interface/my-message.interface';

import { BalanceService } from '../service/balance.service';
import { TransactionType } from '../shemas/enum/transactionType.enam';

@Update()
export class TransactionHandler {
  private readonly logger: Logger = new Logger(TransactionHandler.name);
  constructor(
    private readonly transactionService: TransactionService,
    private readonly balanceService: BalanceService,
  ) {}

  @Command('transactions')
  @Hears(/Transactions 💸|Транзакції 💸/)
  async aboutCommand(ctx: IContext) {
    await ctx.deleteMessage();
    delete ctx.session.type;
    this.logger.log('Транзакция command executed');
    await ctx.replyWithHTML(
      SELECT_TRANSACTION_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsTransaction(ctx.session.language),
    );
  }
  @Action('Приход')
  async incomeCommand(ctx: IContext) {
    ctx.session.type = 'income';
    await ctx.deleteMessage();
    await ctx.replyWithHTML(ENTER_INCOME_MESSAGE[ctx.session.language || 'ua']);

    this.logger.log('Приход command executed');
  }

  @Action('Расход')
  async expenseCommand(ctx: IContext) {
    ctx.session.type = 'expense';
    await ctx.deleteMessage();
    await ctx.replyWithHTML(ENTER_EXPENSE_MESSAGE[ctx.session.language || 'ua']);

    this.logger.log('Расход command executed');
  }
  @Action('Удаление последних️')
  async deleteLastCommand(ctx: IContext) {
    const userId = ctx.from.id;
    ctx.session.type = 'delete';
    await this.transactionService.showLastNTransactionsWithDeleteOption(userId, 10, ctx.session.language || 'ua');
  }
  @Action(/delete_(.+)/)
  async handleCallbackQuery(ctx: IContext) {
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
          await ctx.reply(TRANSACTION_DELETED_MESSAGE[ctx.session.language || 'ua']);
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

  @On('text')
  async textCommand(ctx: IContext) {
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
        await ctx.reply(BALANCE_MESSAGE[ctx.session.language || 'ua']);
        const balance = await this.balanceService.getOrCreateBalance(userId);
        const balanceMessage = getBalanceMessage(balance.balance, ctx.session.language || 'ua');
        await ctx.replyWithHTML(balanceMessage);
        this.logger.log('textCommand executed');
      } catch (error) {
        // this.logger.error('Error in textCommand:', error);
        await ctx.reply(ERROR_MESSAGE[ctx.session.language || 'ua']);
      }
    }
    delete ctx.session.type;
  }
}
