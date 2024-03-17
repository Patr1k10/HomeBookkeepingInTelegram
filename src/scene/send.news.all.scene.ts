import { Ctx, InjectBot, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Context, Telegraf } from 'telegraf';
import { IContext, MyMessage } from '../type/interface';
import { backStartButton } from '../battons';
import { NotificationService } from '../service';

@Wizard('news')
export class SendNewsAllScene {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly notificationService: NotificationService,
  ) {}

  @WizardStep(1)
  @On('text')
  async onChooseChat(@Ctx() ctx: IContext & WizardContext) {
    const message = ctx.message as MyMessage;
    await this.notificationService.notificationsAll(message.text);
    await ctx.deleteMessage();
    await ctx.replyWithHTML(`Новини відправлені✅`, backStartButton());
    await ctx.scene.leave();
  }
}
