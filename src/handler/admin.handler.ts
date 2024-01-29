import { Logger } from '@nestjs/common';
import { BalanceService, NotificationService, PremiumService } from '../service';
import { Action, On, Update } from 'nestjs-telegraf';
import { IContext, MyMessage } from '../interface';
import { SELECT_SETTING_MESSAGE } from '../constants';
import { actionButtonsAdmin, actionButtonsSettings, backStartButton } from '../battons';
@Update()
export class AdminHandler {
  private readonly logger: Logger = new Logger(AdminHandler.name);

  constructor(
    private readonly balanceService: BalanceService,
    private readonly premiumService: PremiumService,
    private readonly notificationService: NotificationService,
  ) {}

  @Action('settings')
  async getSettings(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} getSettings`);
    this.logger.log(`lastBotMessage:${ctx.session.lastBotMessage}`);
    await ctx.editMessageText(SELECT_SETTING_MESSAGE[ctx.session.language || 'ua'], {
      reply_markup: actionButtonsSettings(ctx.session.language, ctx.from.id).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }

  @Action('admin')
  async adminMenuCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} admin menu command executed`);
    await ctx.editMessageText('Це адмін манель ти знаешь що робити', actionButtonsAdmin());
  }
  @Action('adminStat')
  async adminStatMenuCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} adminStat menu command executed`);
    const user = ctx.from;
    ctx.session.isPremium = await this.premiumService.getIsPremium(ctx.from.id);
    const count = await this.balanceService.countAllBalances();
    const activeUsers = await this.balanceService.countActiveUsersLast3Days();
    const bannedUsers = await this.balanceService.countBannedUsers();
    const countIsPremiumUser = await this.premiumService.countPremiumUsers();
    this.logger.log(`
      User ID: ${user.id}
      First Name: ${user.first_name}
      Last Name: ${user.last_name}
      Username: ${user.username}
      ActiveUsers: ${activeUsers}
      Count Users: ${count}
      Count PremiumUsers: ${countIsPremiumUser}
      BannedUsers: ${bannedUsers}
      `);
    await ctx.editMessageText(
      `New User created:
      User ID: ${user.id}
      First Name: ${user.first_name}
      Last Name: ${user.last_name}
      Username: ${user.username}
      ActiveUsers: ${activeUsers}
      Count Users: ${count}
      Count PremiumUsers: ${countIsPremiumUser}
      BannedUsers: ${bannedUsers}`,
      backStartButton(),
    );
  }
  @Action('sendNews')
  async sendNews(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} sendNews`);
    await ctx.editMessageText(`нваиши новини та її побачать усі🔽🔽🔽`, backStartButton());
    ctx.session.type = 'sendNewsAllUser';
    this.logger.log(`${JSON.stringify(ctx.session)}`);
  }
  @On('text')
  async sendNewsAllUser(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} sendNewsAll`);
    if (ctx.session.type !== 'sendNewsAllUser') {
      return;
    }
    const message = ctx.message as MyMessage;
    await this.notificationService.notificationsAll(message.text);
    await ctx.deleteMessage();
    await ctx.replyWithHTML(`Новини відправлені✅`, backStartButton());
    delete ctx.session.type;
  }
}
