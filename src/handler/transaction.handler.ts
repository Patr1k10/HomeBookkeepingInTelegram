import { Action, Ctx, On, Update } from 'nestjs-telegraf';
import { TransactionService } from '../service';
import { Logger } from '@nestjs/common';
import { BalanceService } from '../service';
import { TransactionType } from '../type/enum/transactionType.enam';
import {
  BALANCE_MESSAGE,
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
import { resetSession } from '../common/reset.session';
import { WizardContext } from 'telegraf/typings/scenes';

@Update()
export class TransactionHandler {
  private readonly logger: Logger = new Logger(TransactionHandler.name);
  constructor(
    private readonly transactionService: TransactionService,
    private readonly balanceService: BalanceService,
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
    for (const transaction of transactions) {
      const matches = transaction.match(regex);
      if (!matches) {
        errorMessageSent = true;
        continue;
      }
      const transactionName = matches[1].trim().toLowerCase();
      const amount = Number(matches[2]);
      if (!transactionName || isNaN(amount) || amount <= 0) {
        errorMessageSent = true;
        continue;
      }
      const words = transactionName.split(' ');
      if (words.length > 2) {
        errorMessageSent = true;
        continue;
      }
      const transactionType = ctx.session.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE;
      try {
        await this.transactionService.createTransaction({
          userId,
          transactionName,
          transactionType,
          amount,
          userName,
        });
        await this.balanceService.updateBalance(userId, amount, transactionType);
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
      const balance = await this.balanceService.getBalance(userId, ctx.session.group);
      const balanceMessage = getBalanceMessage(balance, ctx.session.language || 'ua', ctx.session.currency || 'UAH');
      await ctx.replyWithHTML(`${BALANCE_MESSAGE[ctx.session.language]}\n${balanceMessage}`, {
        parse_mode: 'HTML',
        reply_markup: backTranButton(ctx.session.language || 'ua').reply_markup,
      });
      this.logger.log(`user:${ctx.from.id} textCommand executed`);
    }

    delete ctx.session.type;
  }

  @Action('backT')
  async backT(@Ctx() ctx: IContext & WizardContext) {
    this.logger.log(`user:${ctx.from.id} backT executed`);
    await resetSession(ctx);
    await ctx.editMessageText(
      SELECT_TRANSACTION_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsTransaction(ctx.session.language || 'ua'),
    );
  }
}
