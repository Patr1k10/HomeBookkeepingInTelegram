import { Action, Command, Hears, InjectBot, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { CustomCallbackQuery, IContext } from '../interface/context.interface';
import { groupButton } from '../battons/app.buttons';
import { MyMessage } from '../interface/my-message.interface';
import { Telegraf } from 'telegraf';
import { FAMILY_TEXT } from '../constants/familyText.constants';
import { BUTTONS } from '../constants/buttons.const';
import { GROUP_INVITATION_MESSAGE, INVITATION_ACCEPTED_MESSAGE } from '../constants/messages';

@Update()
export class FamilyHandler {
  private readonly logger: Logger = new Logger(FamilyHandler.name);

  constructor(
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
  ) {}

  @Hears('Родина👨‍👩‍👧‍👧')
  @Command('group')
  async groupCommand(ctx: IContext) {
    this.logger.log('Executing groupCommand');
    await ctx.reply(FAMILY_TEXT[ctx.session.language || 'ua'].FAMILY_MENU, groupButton(ctx.session.language));
  }

  @Action('get_id')
  async getId(ctx: IContext) {
    this.logger.log('Executing getId');
    const userId = ctx.from.id;
    const message = FAMILY_TEXT[ctx.session.language].YOUR_ID;
    await ctx.reply(`${message} ${userId}`);
  }

  // @Action('create_group')
  // async createGroup(ctx: IContext) {
  //   this.logger.log('Executing createGroup');
  //   const userId = ctx.from.id;
  //   if (!ctx.session.group) {
  //     ctx.session.group = [];
  //   }
  //   if (!ctx.session.group.includes(userId)) {
  //     ctx.session.group.push(userId);
  //   }
  //   await ctx.reply(FAMILY_TEXT[ctx.session.language || 'ua'].GROUP_CREATED);
  // }

  @Action('add_to_group')
  async addToGroup(ctx: IContext) {
    this.logger.log('Executing addToGroup');
    const userId = ctx.from.id;
    if (!ctx.session.group) {
      ctx.session.group = [];
    }
    if (!ctx.session.group.includes(userId)) {
      ctx.session.group.push(userId);
    }
    await ctx.reply(FAMILY_TEXT[ctx.session.language || 'ua'].ENTER_USER_ID);
    ctx.session.awaitingUserIdInput = true;
  }

  @Hears(/^\d+$/)
  async addUserId(ctx: IContext) {
    const userId = ctx.from.id;
    this.logger.log('Executing addUserId');
    if (ctx.session.awaitingUserIdInput) {
      const message = ctx.message as MyMessage;
      const inputId = parseInt(message.text, 10);

      if (!ctx.session.group) {
        ctx.session.group = [];
      }

      if (!ctx.session.group.includes(inputId)) {
        ctx.session.group.push(inputId);
        await this.sendInvite(ctx, inputId, userId);
        await ctx.reply(`${FAMILY_TEXT[ctx.session.language || 'ua'].INVITE_SENT} ${inputId}.`);
      } else {
        await ctx.reply(`${FAMILY_TEXT[ctx.session.language || 'ua'].ID_ALREADY_EXISTS}`);
      }

      ctx.session.awaitingUserIdInput = false;
    }
  }

  async sendInvite(ctx: IContext, inputId: number, userId: number) {
    const message = GROUP_INVITATION_MESSAGE(userId, ctx.session.language);
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: BUTTONS[ctx.session.language].AGREE, callback_data: `accept_invite:${userId}` }],
          [{ text: BUTTONS[ctx.session.language].DISAGREE, callback_data: `decline_invite:${userId}` }],
        ],
      },
    };
    await this.bot.telegram.sendMessage(inputId, message, opts);
  }

  @Action(/^accept_invite:\d+$/)
  async acceptInvite(ctx: IContext) {
    const userId = ctx.from.id;
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    const inputId = parseInt(callbackQuery.message.text.split(':')[1], 10);
    const message = INVITATION_ACCEPTED_MESSAGE(inputId, ctx.session.language);

    if (!ctx.session.group) {
      ctx.session.group = [];
    }

    if (!ctx.session.group.includes(inputId)) {
      ctx.session.group.push(inputId);
      ctx.session.group.push(userId);
    }
    await ctx.reply(message);
  }

  @Action(/^decline_invite:\d+$/)
  async declineInvite(ctx: IContext) {
    this.logger.log('Executing declineInvite');
    const userId = ctx.from.id;

    if (ctx.session.group && ctx.session.group.includes(userId)) {
      const index = ctx.session.group.indexOf(userId);
      ctx.session.group.splice(index, 1);
    }
    await ctx.reply(FAMILY_TEXT[ctx.session.language || 'ua'].INVITATION_DECLINED);
  }

  @Action('remove_group')
  async deleteGroup(ctx: IContext) {
    delete ctx.session.type;
    this.logger.log('Executing deleteGroup');
    if (ctx.session.group && ctx.session.group.length > 0) {
      ctx.session.group = [];
      await ctx.reply(FAMILY_TEXT[ctx.session.language || 'ua'].GROUP_DELETED);
    } else {
      await ctx.reply(FAMILY_TEXT[ctx.session.language || 'ua'].GROUP_EMPTY);
    }
  }
}
