import { Logger } from '@nestjs/common';
import { AdvancedStatisticsService, BalanceService, PremiumService } from '../service';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { IContext } from '../type/interface';
import { MAIN_MENU, SELECT_SETTING_MESSAGE } from '../constants';
import {
  actionButtonsAdmin,
  actionButtonsAdminBack,
  actionButtonsAdminStat,
  actionButtonsSettings,
  backStartButton,
} from '../battons';
import { resetSession } from '../common';
import { WizardContext } from 'telegraf/typings/scenes';
@Update()
export class AdminHandler {
  private readonly logger: Logger = new Logger(AdminHandler.name);

  constructor(
    private readonly balanceService: BalanceService,
    private readonly premiumService: PremiumService,
    private readonly advancedStatisticsService: AdvancedStatisticsService,
  ) {}

  @Action('settings')
  async getSettings(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} getSettings`);
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
  @Action('getAdminStat')
  async adminStatMenuCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} adminStat menu command executed`);
    const user = ctx.from;
    ctx.session.isPremium = await this.premiumService.getIsPremium(ctx.from.id);
    const count = await this.balanceService.countAllBalances();
    const activeUsers = await this.balanceService.countActiveUsersLast3Days();
    const bannedUsers = await this.balanceService.countBannedUsers();
    const countIsPremiumUser = await this.premiumService.countPremiumUsers();
    const { today, week, month } = await this.advancedStatisticsService.getTotalTransactions();
    this.logger.log(`
      User ID: ${user.id}
      First Name: ${user.first_name}
      Last Name: ${user.last_name}
      Username: ${user.username}
      TotalTransactionsToday: ${today}
      TotalTransactionsWeek: ${week}
      TotalTransactionsMonth: ${month}
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
      TotalTransactionsToday: ${today}
      TotalTransactionsWeek: ${week}
      TotalTransactionsMonth: ${month}
      ActiveUsers: ${activeUsers}
      Count Users: ${count}
      Count PremiumUsers: ${countIsPremiumUser}
      BannedUsers: ${bannedUsers}`,
      actionButtonsAdminBack(),
    );
  }

  @Action('adminStat')
  async adminStatCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} adminStatCommand menu command executed`);
    await ctx.editMessageText(`Адмін сататистика всього бота`, actionButtonsAdminStat(ctx.session.language || 'ua'));
  }

  @Action('transactAdminStat')
  async transactAdminStatCommand(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} transactAdminStatCommand`);
  }

  @Action('sendNews')
  async sendNews(@Ctx() ctx: IContext & WizardContext) {
    this.logger.log(`user:${ctx.from.id} sendNews`);
    await ctx.editMessageText(`нваиши новини та її побачать усі🔽🔽🔽`, backStartButton());
    await ctx.scene.enter('news');
  }
  @Action('popularTransactions')
  async popularTransactions(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} popularTransactions`);
    const topTransaction = await this.advancedStatisticsService.getTop10TransactionNames();
    const message = topTransaction
      .map((transaction) => {
        return `Name: <b>${transaction.name}</b>, Count: ${transaction.count}`;
      })
      .join('\n');
    await ctx.editMessageText(message, { reply_markup: actionButtonsAdminBack().reply_markup, parse_mode: 'HTML' });
  }
  @Action('toUser')
  async toUser(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} toUser`);
    const topUsers = await this.advancedStatisticsService.getTop10UsersWithMostTransactions();
    const message = topUsers
      .map((user) => {
        return `Name: <b>${user.userId}</b>, Count: ${user.transactionCount}`;
      })
      .join('\n');
    await ctx.editMessageText(message, { reply_markup: actionButtonsAdminBack().reply_markup, parse_mode: 'HTML' });
  }

  @Action('refData')
  async refData(ctx: IContext) {
    this.logger.log(`user:${ctx.from.id} refData`);
    const refData = await this.advancedStatisticsService.getRefData();
    const refDataMessage = `
    Undefined Count: ${refData.undefinedCount}\nUnique Start Payloads:\n${refData.uniqueStartPayloads
      .map((payload) => `Payload: <b>${payload.payload}</b>, Count: ${payload.count}`)
      .join('\n')}
  `;
    await ctx.editMessageText(refDataMessage, {
      reply_markup: actionButtonsAdminBack().reply_markup,
      parse_mode: 'HTML',
    });
  }

  @Action('backA')
  async backA(ctx: IContext & WizardContext) {
    this.logger.log(`user:${ctx.from.id} backA`);
    await resetSession(ctx);
    await ctx.editMessageText(
      MAIN_MENU[ctx.session.language || 'ua'],
      actionButtonsAdmin(ctx.session.language || 'ua'),
    );
  }
  @Action('backSettings')
  async backSettings(ctx: IContext & WizardContext) {
    this.logger.log(`user:${ctx.from.id} backSettings`);
    await resetSession(ctx);
    await ctx.editMessageText(
      MAIN_MENU[ctx.session.language || 'ua'],
      actionButtonsSettings(ctx.session.language || 'ua', ctx.from.id),
    );
  }
}
