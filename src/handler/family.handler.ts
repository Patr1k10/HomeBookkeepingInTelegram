import { Action, Hears, InjectBot, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { acceptButton, backFamilyButton, backStartButton, groupButton } from '../battons/app.buttons';
import { Telegraf } from 'telegraf';
import { BUTTONS, FAMILY_TEXT, GROUP_INVITATION_MESSAGE, INVITATION_ACCEPTED_MESSAGE } from '../constants';
import { CustomCallbackQuery, IContext, MyMessage } from '../interface';

@Update()
export class FamilyHandler {
  private readonly logger: Logger = new Logger(FamilyHandler.name);

  constructor(
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
  ) {}

  @Action('family')
  async groupCommand(ctx: IContext) {
    this.logger.log('Executing groupCommand');
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      FAMILY_TEXT[ctx.session.language || 'ua'].FAMILY_MENU,
      groupButton(ctx.session.language || 'ua'),
    );
  }

  @Action('get_id')
  async getId(ctx: IContext) {
    this.logger.log('Executing getId');
    const message = FAMILY_TEXT[ctx.session.language || 'ua'].YOUR_ID;
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      `${message} ${ctx.from.id}`,
      backFamilyButton(ctx.session.language || 'ua'),
    );
  }

  @Action('add_to_group')
  async addToGroup(ctx: IContext) {
    this.logger.log('Executing addToGroup');
    if (!ctx.session.group) {
      ctx.session.group = [];
    }
    if (!ctx.session.group.includes(ctx.from.id)) {
      ctx.session.group.push(ctx.from.id);
    }
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      FAMILY_TEXT[ctx.session.language || 'ua'].ENTER_USER_ID,
      backFamilyButton(ctx.session.language || 'ua'),
    );

    ctx.session.awaitingUserIdInput = true;
  }

  @Hears(/^\d+$/)
  async addUserId(ctx: IContext) {
    if (ctx.session.awaitingUserIdInput === false) {
      return;
    }
    const initiatorId = ctx.from.id;
    this.logger.log('Executing addUserId');
    const message = ctx.message as MyMessage;
    const recipientId = parseInt(message.text, 10);
    if (isNaN(recipientId)) {
      await ctx.deleteMessage();
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        FAMILY_TEXT[ctx.session.language || 'ua'].INVALID_INPUT,
        backFamilyButton(ctx.session.language || 'ua'),
      );
      ctx.session.awaitingUserIdInput = false;
      return;
    }

    if (!ctx.session.group) {
      ctx.session.group = [];
    }
    if (!ctx.session.group.includes(recipientId)) {
      await this.sendInvite(ctx, recipientId, initiatorId);
      await ctx.deleteMessage();
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        `${FAMILY_TEXT[ctx.session.language || 'ua'].INVITE_SENT} ${recipientId}.`,
        groupButton(ctx.session.language || 'ua'),
      );
    } else {
      await ctx.deleteMessage();
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        `${FAMILY_TEXT[ctx.session.language || 'ua'].ID_ALREADY_EXISTS} ${recipientId}.`,
        groupButton(ctx.session.language || 'ua'),
      );
      ctx.session.awaitingUserIdInput = false;
    }
  }

  private async sendInvite(ctx: IContext, recipientId: number, initiatorId: number) {
    const message = GROUP_INVITATION_MESSAGE(initiatorId, ctx.session.language);
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: BUTTONS[ctx.session.language].AGREE, callback_data: `accept_invite:${initiatorId}` }],
          [{ text: BUTTONS[ctx.session.language].DISAGREE, callback_data: `decline_invite:${initiatorId}` }],
        ],
      },
    };

    try {
      await this.bot.telegram.sendMessage(recipientId, message, keyboard);
    } catch (error) {
      this.logger.error(`sendInvite failed: ${error}`)
    }
  }

  @Action(/^accept_invite:\d+$/)
  async acceptInvite(ctx: IContext) {
    const recipientId = ctx.from.id;
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    const initiatorId = parseInt(callbackQuery.message.text.split(':')[1], 10);
    const message = INVITATION_ACCEPTED_MESSAGE(initiatorId, ctx.session.language || 'ua');

    if (!ctx.session.group) {
      ctx.session.group = [];
    }

    if (!ctx.session.group.includes(initiatorId)) {
      ctx.session.group.push(initiatorId);
      ctx.session.group.push(recipientId);
    }
    await ctx.telegram.sendMessage(
      initiatorId,
      FAMILY_TEXT[ctx.session.language].ACCEPT,
      acceptButton(ctx.session.language, recipientId),
    );
    await ctx.deleteMessage();
    const sendMessage = await ctx.telegram.sendMessage(recipientId, message, groupButton(ctx.session.language || 'ua'));
    ctx.session.lastBotMessage = sendMessage.message_id;
  }
  @Action(/^accept_user:\d+$/)
  async acceptUser(ctx: IContext) {
    const initiatorId = ctx.from.id;
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    const recipientId = parseInt(callbackQuery.data.split(':')[1], 10);
    if (!ctx.session.group) {
      ctx.session.group = [];
    }
    ctx.session.group.push(recipientId);
    await ctx.deleteMessage();
    const sendMessage = await ctx.telegram.sendMessage(
      initiatorId,
      FAMILY_TEXT[ctx.session.language].GROUP_CREATED,
      groupButton(ctx.session.language || 'ua'),
    );
    ctx.session.lastBotMessage = sendMessage.message_id;
    this.logger.log('GROUP_CREATED');
  }

  @Action(/^decline_invite:\d+$/)
  async declineInvite(ctx: IContext) {
    this.logger.log('Executing declineInvite');
    const recipientId = ctx.from.id;
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    const initiatorId = parseInt(callbackQuery.message.text.split(':')[1], 10);
    if (ctx.session.group && ctx.session.group.includes(recipientId)) {
      const index = ctx.session.group.indexOf(recipientId);
      ctx.session.group.splice(index, 1);
    }
    await ctx.telegram.sendMessage(initiatorId, FAMILY_TEXT[ctx.session.language].DECLINE, backStartButton());
    const sendMessage = await ctx.telegram.sendMessage(
      recipientId,
      FAMILY_TEXT[ctx.session.language || 'ua'].INVITATION_DECLINED,
      groupButton(ctx.session.language || 'ua'),
    );
    ctx.session.lastBotMessage = sendMessage.message_id;
  }

  @Action('remove_group')
  async deleteGroup(ctx: IContext) {
    delete ctx.session.type;
    this.logger.log('Executing deleteGroup');
    if (ctx.session.group && ctx.session.group.length > 0) {
      ctx.session.group = [];
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        FAMILY_TEXT[ctx.session.language || 'ua'].GROUP_DELETED,
        backFamilyButton(ctx.session.language || 'ua'),
      );
    } else {
      await ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.lastBotMessage,
        null,
        FAMILY_TEXT[ctx.session.language || 'ua'].GROUP_EMPTY,
        backFamilyButton(ctx.session.language || 'ua'),
      );
    }
  }
  @Action('backF')
  async backT(ctx: IContext) {
    delete ctx.session.selectedDate;
    delete ctx.session.selectedMonth;
    delete ctx.session.selectedYear;
    ctx.session.awaitingUserIdInput = false;
    delete ctx.session.type;
    await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.lastBotMessage,
      null,
      FAMILY_TEXT[ctx.session.language || 'ua'].FAMILY_MENU,
      groupButton(ctx.session.language || 'ua'),
    );
  }
}
