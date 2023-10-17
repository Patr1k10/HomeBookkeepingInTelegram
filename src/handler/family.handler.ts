import { Action, Command, Hears, InjectBot, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { CustomCallbackQuery, IContext } from '../interface/context.interface';
import { groupButton } from '../battons/app.buttons';
import { MyMessage } from '../interface/my-message.interface';
import { Telegraf } from 'telegraf';

@Update()
export class FamilyHandler {
  private readonly logger: Logger = new Logger(FamilyHandler.name);
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
  ) {}
  @Hears('Родина👨‍👩‍👧‍👧(у розробці)')
  @Command('group')
  async groupCommand(ctx: IContext) {
    await ctx.reply('Родинне меню:', groupButton());
  }
  @Action('get_id')
  async getId(ctx: IContext) {
    const userId = ctx.from.id;
    await ctx.reply(`get_id: ${userId}`);
  }
  @Action('create_group')
  async createGroup(ctx: IContext) {
    const userId = ctx.from.id;
    if (!ctx.session.group) {
      ctx.session.group = [];
    }
    if (!ctx.session.group.includes(userId)) {
      ctx.session.group.push(userId);
    }
    await ctx.reply('Группа создана, ваш ID добавлен');
  }
  @Action('add_to_group')
  async addToGroup(ctx: IContext) {
    await ctx.reply('Пожалуйста, введите ID пользователя, который вы хотите добавить в группу.');
    ctx.session.awaitingUserIdInput = true;
  }
  @Hears(/^\d+$/)
  async addUserId(ctx: IContext) {
    if (ctx.session.awaitingUserIdInput) {
      const message = ctx.message as MyMessage;
      const inputId = parseInt(message.text, 10);
      const userId = ctx.from.id;

      if (!ctx.session.group) {
        ctx.session.group = [];
      }

      if (!ctx.session.group.includes(inputId)) {
        ctx.session.group.push(inputId);
        await this.sendInvite(ctx, inputId, userId);
        await ctx.reply(`Приглашение отправлено пользователю с ID ${inputId}.`);
      } else {
        await ctx.reply(`ID ${inputId} уже есть в группе.`);
      }

      ctx.session.awaitingUserIdInput = false;
    }
  }
  async sendInvite(ctx: IContext, inputId: number, userId: number) {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Согласен', callback_data: `accept_invite:${userId}` }],
          [{ text: 'Не согласен', callback_data: `decline_invite:${userId}` }],
        ],
      },
    };
    await this.bot.telegram.sendMessage(
      inputId,
      `Вы были приглашены в группу пользователем:${userId} . Принимаете?`,
      opts,
    );
  }

  @Action(/^accept_invite:\d+$/)
  async acceptInvite(ctx: IContext) {
    const userId = ctx.from.id;
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    const inputId = parseInt(callbackQuery.message.text.split(':')[1], 10);

    if (!ctx.session.group) {
      ctx.session.group = [];
    }

    if (!ctx.session.group.includes(inputId)) {
      ctx.session.group.push(inputId);
      ctx.session.group.push(userId);
    }
    await ctx.reply(`Вы приняли приглашение от пользователя с ID ${inputId}`);
  }

  @Action(/^decline_invite:\d+$/)
  async declineInvite(ctx: IContext) {
    const userId = ctx.from.id;
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    const inputId = parseInt(callbackQuery.data.split(':')[1], 10);
    if (ctx.session.group && ctx.session.group.includes(userId)) {
      const index = ctx.session.group.indexOf(userId);
      ctx.session.group.splice(index, 1);
    }
    await ctx.reply(`Вы отклонили приглашение от пользователя с ID ${inputId}`);
  }

  @Action('live_group')
  async liveGroup(ctx: IContext) {
    const userId = ctx.from.id;
    if (ctx.session.group && ctx.session.group.includes(userId)) {
      const index = ctx.session.group.indexOf(userId);
      ctx.session.group.splice(index, 1);
      await ctx.reply('Вы успешно покинули группу.');
    } else {
      await ctx.reply('Вы не являетесь частью какой-либо группы.');
    }
  }

  @Action('delete_group')
  async deleteGroup(ctx: IContext) {
    if (ctx.session.group && ctx.session.group.length > 0) {
      ctx.session.group = [];
      await ctx.reply('Группа успешно удалена.');
    } else {
      await ctx.reply('Группа уже пуста или не существует.');
    }
  }
}
