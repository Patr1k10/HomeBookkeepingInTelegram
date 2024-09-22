import { Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { CompoundInterestData, IContext, MyMessage } from '../type/interface';

import { Logger } from '@nestjs/common';
import { FinancialLiteracyService } from '../service';
import { backStartButton } from '../battons';
import { COMPOUND_INTEREST_RESULT } from '../constants';

@Wizard('compound-interest')
export class CompoundInterestScene {
  private readonly logger: Logger = new Logger(CompoundInterestScene.name);
  constructor(private readonly financialLiteracyService: FinancialLiteracyService) {}

  @WizardStep(1)
  @On('text')
  async compoundInterestText(@Ctx() ctx: IContext & WizardContext) {
    const message = ctx.message as MyMessage;
    const text = message.text;

    const dataArray = text.split(',').map((t) => Number(t.trim()));

    const data: CompoundInterestData = {
      amountPerMonth: dataArray[0],
      rate: dataArray[1],
      durationInYears: dataArray[2],
    };
    const totalAmount = await this.financialLiteracyService.calculateCompoundInterest(data, ctx.session.language);
    await ctx.deleteMessage();
    await ctx.replyWithHTML(COMPOUND_INTEREST_RESULT(data, totalAmount, ctx), backStartButton());

    await ctx.scene.leave();
  }
}
