import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { IContext } from '../type/interface';
import { FINANCE_LITERACY_COMPOUND_INTEREST_TEX, FINANCE_LITERACY_TEXT } from '../constants';
import { backStartButton, financialLiteracyButtons } from '../battons';
import { WizardContext } from 'telegraf/typings/scenes';

@Update()
export class FinancialLiteracyHandler {
  private readonly logger: Logger = new Logger(FinancialLiteracyHandler.name);

  @Action('financial-literacy')
  async handleFinancialLiteracyCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} handleFinancialLiteracyCommand`);
    await ctx.editMessageText(FINANCE_LITERACY_TEXT[ctx.session.language], {
      reply_markup: financialLiteracyButtons(ctx.session.language).reply_markup,
      parse_mode: 'HTML',
    });
  }
  @Action('compound-interest')
  async handleCompoundInterestCommand(@Ctx() ctx: IContext & WizardContext) {
    this.logger.log(`user:${ctx.from.id} handleCompoundInterestCommand`);
    await ctx.editMessageText(FINANCE_LITERACY_COMPOUND_INTEREST_TEX[ctx.session.language], {
      parse_mode: 'HTML',
      reply_markup: backStartButton(ctx.session.language).reply_markup,
    });
    await ctx.scene.enter('compound-interest');
  }
}
