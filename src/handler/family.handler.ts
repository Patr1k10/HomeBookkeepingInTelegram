import { Action, Command, Hears, InjectBot, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { CustomCallbackQuery, IContext } from '../interface/context.interface';
import { groupButton } from '../battons/app.buttons';
import { MyMessage } from '../interface/my-message.interface';
import { Telegraf } from 'telegraf';
import { FAMILY_TEXT } from '../constants/familyText.constants';
import { BUTTONS } from '../constants/buttons.const';

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
    await ctx.reply(FAMILY_TEXT[ctx.session.language].FAMILY_MENU, groupButton(ctx.session.language));
  }

  @Action('get_id')
  async getId(ctx: IContext) {
    const userId = ctx.from.id;
    const message = FAMILY_TEXT[ctx.session.language].YOUR_ID;
    await ctx.reply(`${message} ${userId}`);
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
    await ctx.reply(FAMILY_TEXT[ctx.session.language].GROUP_CREATED);
  }

  @Action('add_to_group')
  async addToGroup(ctx: IContext) {
    await ctx.reply(FAMILY_TEXT[ctx.session.language].ENTER_USER_ID);
    ctx.session.awaitingUserIdInput = true;
  }

  @Hears(/^\d+$/)
  async addUserId(ctx: IContext) {
    if (ctx.session.awaitingUserIdInput) {
      const message = ctx.message as MyMessage;
      const inputId = parseInt(message.text, 10);

      if (!ctx.session.group) {
        ctx.session.group = [];
      }

      if (!ctx.session.group.includes(inputId)) {
        ctx.session.group.push(inputId);
        await this.sendInvite(ctx, inputId);
        await ctx.reply(`${FAMILY_TEXT[ctx.session.language].INVITE_SENT} ${inputId}.`);
      } else {
        await ctx.reply(`${FAMILY_TEXT[ctx.session.language].ID_ALREADY_EXISTS}`);
      }

      ctx.session.awaitingUserIdInput = false;
    }
  }

  async sendInvite(ctx: IContext, inputId: number) {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: BUTTONS[ctx.session.language].AGREE, callback_data: `accept_invite:${inputId}` }],
          [{ text: BUTTONS[ctx.session.language].DISAGREE, callback_data: `decline_invite:${inputId}` }],
        ],
      },
    };
    await this.bot.telegram.sendMessage(inputId, FAMILY_TEXT[ctx.session.language].INVITATION_TEXT, opts);
  }

  @Action(/^accept_invite:\d+$/)
  async acceptInvite(ctx: IContext) {
    const userId = ctx.from.id;

    if (!ctx.session.group) {
      ctx.session.group = [];
    }

    if (!ctx.session.group.includes(userId)) {
      ctx.session.group.push(userId);
    }
    await ctx.reply(FAMILY_TEXT[ctx.session.language].INVITATION_ACCEPTED);
  }

  @Action(/^decline_invite:\d+$/)
  async declineInvite(ctx: IContext) {
    const userId = ctx.from.id;

    if (ctx.session.group && ctx.session.group.includes(userId)) {
      const index = ctx.session.group.indexOf(userId);
      ctx.session.group.splice(index, 1);
    }
    await ctx.reply(FAMILY_TEXT[ctx.session.language].INVITATION_DECLINED);
  }

  @Action('delete_group')
  async deleteGroup(ctx: IContext) {
    if (ctx.session.group && ctx.session.group.length > 0) {
      ctx.session.group = [];
      await ctx.reply(FAMILY_TEXT[ctx.session.language].GROUP_DELETED);
    } else {
      await ctx.reply(FAMILY_TEXT[ctx.session.language].GROUP_EMPTY);
    }
  }

  @Action('help_pliz')
  async help(ctx: IContext) {
    await ctx.reply('jgh');
  }
}
