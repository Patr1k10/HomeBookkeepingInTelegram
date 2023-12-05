import { Action, On, Update } from 'nestjs-telegraf';
import { TransactionService } from '../service';
import { Logger } from '@nestjs/common';
import { actionButtonsTransaction, backTranButton } from '../battons/app.buttons';
import { CustomCallbackQuery, IContext } from '../interface/context.interface';
import { MyMessage } from '../interface/my-message.interface';
import { BalanceService } from '../service';
import { TransactionType } from '../shemas/enum/transactionType.enam';
import { checkAndUpdateLastBotMessage } from '../utils/botUtils';
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

@Update()
export class TransactionHandler {
  private readonly logger: Logger = new Logger(TransactionHandler.name);
  constructor(
    private readonly transactionService: TransactionService,
    private readonly balanceService: BalanceService,
  ) {}

  @Action('transactions')
  async aboutCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    delete ctx.session.type;
    this.logger.log('transactions command executed');
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      SELECT_TRANSACTION_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsTransaction(ctx.session.language),
    );
  }
  @Action('income')
  async incomeCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    ctx.session.type = 'income';
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      ENTER_INCOME_MESSAGE[ctx.session.language || 'ua'],
      backTranButton(ctx.session.language || 'ua'),
    );

    this.logger.log('Приход command executed');
  }

  @Action('expense')
  async expenseCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    ctx.session.type = 'expense';
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      ENTER_EXPENSE_MESSAGE[ctx.session.language || 'ua'],
      backTranButton(ctx.session.language || 'ua'),
    );

    this.logger.log('Расход command executed');
  }
  @Action('delete_last')
  async deleteLastCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    ctx.session.type = 'delete';
    const count = 20;
    await this.transactionService.showLastNTransactionsWithDeleteOption(ctx, count);
  }
  @Action(/delete_(.+)/)
  async handleCallbackQuery(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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
          await ctx.telegram.editMessageText(
            ctx.from.id,
            ctx.session.lastBotMessage,
            null,
            TRANSACTION_DELETED_MESSAGE[ctx.session.language || 'ua'],
            backTranButton(ctx.session.language || 'ua'),
          );
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
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }

    const message = ctx.message as MyMessage;
    const userId = ctx.from.id;
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
        });
        await this.balanceService.updateBalance(userId, amount, transactionType);
      } catch (error) {
        this.logger.error('Error creating transaction:', error);
        errorMessageSent = true;
      }
    }
    if (errorMessageSent) {
      await ctx.deleteMessage();
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        INVALID_DATA_MESSAGE[ctx.session.language || 'ua'],
        backTranButton(ctx.session.language || 'ua'),
      );
    } else {
      await ctx.deleteMessage();
      const balance = await this.balanceService.getBalance(userId, ctx.session.group);
      const balanceMessage = getBalanceMessage(balance, ctx.session.language || 'ua', ctx.session.currency || 'UAH');
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        `${BALANCE_MESSAGE[ctx.session.language]}\n${balanceMessage}`,
        {
          parse_mode: 'HTML',
          reply_markup: backTranButton(ctx.session.language || 'ua').reply_markup,
        },
      );
      this.logger.log('textCommand executed');
    }

    delete ctx.session.type;
  }

  @Action('backT')
  async backT(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    ctx.session.awaitingUserIdInput = false;
    delete ctx.session.type;
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      SELECT_TRANSACTION_MESSAGE[ctx.session.language || 'ua'],
      actionButtonsTransaction(ctx.session.language || 'ua'),
    );
  }
}
