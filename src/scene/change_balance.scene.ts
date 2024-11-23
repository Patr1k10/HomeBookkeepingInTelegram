import { Ctx, InjectBot, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Context, Telegraf } from 'telegraf';
import { IContext, MyMessage } from '../type/interface';
import { backStartButton } from '../battons';
import { BalanceService } from '../service';
import { PLEASE_NUM, SET_BALANCE } from '../constants';

@Wizard('change_balance')
export class Change_balanceScene {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly balanceService: BalanceService,
  ) {}

  @WizardStep(1)
  @On('text')
  async onChooseChat(@Ctx() ctx: IContext & WizardContext) {
    const message = ctx.message as MyMessage;
    if (!/^-?\d+$/.test(message.text)) {
      await ctx.reply(`${PLEASE_NUM[ctx.session.language]}`);
      return;
    }
    const amount = parseInt(message.text, 10);

    await this.balanceService.setBalance(ctx.from.id, amount);
    await ctx.deleteMessage();
    await ctx.replyWithHTML(`${SET_BALANCE[ctx.session.language]}${amount}`, backStartButton());
    await ctx.scene.leave();
  }
}
