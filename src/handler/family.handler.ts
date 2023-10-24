import { Action, InjectBot, On, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { CustomCallbackQuery, IContext } from '../interface/context.interface';
import { backFamilyButton, groupButton } from '../battons/app.buttons';
import { MyMessage } from '../interface/my-message.interface';
import { Telegraf } from 'telegraf';
import { FAMILY_TEXT } from '../constants/familyText.constants';
import { BUTTONS } from '../constants/buttons.const';
import { GROUP_INVITATION_MESSAGE, INVITATION_ACCEPTED_MESSAGE } from '../constants/messages';
import { checkAndUpdateLastBotMessage } from '../utils/botUtils';

@Update()
export class FamilyHandler {
  private readonly logger: Logger = new Logger(FamilyHandler.name);

  constructor(
    @InjectBot()
    private readonly bot: Telegraf<IContext>,
  ) {}

  @Action('family')
  async groupCommand(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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

  @On('text')
  async addUserId(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
    const userId = ctx.from.id;
    this.logger.log('Executing addUserId');
    if (ctx.session.awaitingUserIdInput) {
      const message = ctx.message as MyMessage;
      const inputId = parseInt(message.text, 10);
      if (isNaN(inputId)) {
        await ctx.deleteMessage();
        await ctx.telegram.editMessageText(
          ctx.from.id,
          ctx.session.lastBotMessage,
          null,
          FAMILY_TEXT[ctx.session.language || 'ua'].INVALID_INPUT,
          backFamilyButton(ctx.session.language || 'ua'),
        );
        return;
      }

      if (!ctx.session.group) {
        ctx.session.group = [];
      }

      if (!ctx.session.group.includes(inputId)) {
        ctx.session.group.push(inputId);
        await this.sendInvite(ctx, inputId, userId);
        await ctx.deleteMessage();
        await ctx.telegram.editMessageText(
          ctx.from.id,
          ctx.session.lastBotMessage,
          null,
          `${FAMILY_TEXT[ctx.session.language || 'ua'].INVITE_SENT} ${inputId}.`,
          groupButton(ctx.session.language || 'ua'),
        );
      } else {
        await ctx.deleteMessage();
        await ctx.telegram.editMessageText(
          ctx.from.id,
          ctx.session.lastBotMessage,
          null,
          `${FAMILY_TEXT[ctx.session.language || 'ua'].ID_ALREADY_EXISTS} ${inputId}.`,
          groupButton(ctx.session.language || 'ua'),
        );
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

    try {
      await this.bot.telegram.sendMessage(inputId, message, opts);
      console.log(`Сообщение успешно отправлено пользователю с ID ${inputId}`);
    } catch (error) {
      console.error(`Ошибка при отправке сообщения пользователю с ID ${inputId}: ${error.message}`);
    }
  }

  @Action(/^accept_invite:\d+$/)
  async acceptInvite(ctx: IContext) {
    const userId = ctx.from.id;
    const callbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    const inputId = parseInt(callbackQuery.message.text.split(':')[1], 10);
    const message = INVITATION_ACCEPTED_MESSAGE(inputId, ctx.session.language || 'ua');

    if (!ctx.session.group) {
      ctx.session.group = [];
    }

    if (!ctx.session.group.includes(inputId)) {
      ctx.session.group.push(inputId);
      ctx.session.group.push(userId);
    }
    await ctx.deleteMessage();
    const sendMessage = await ctx.telegram.sendMessage(userId, message, groupButton(ctx.session.language || 'ua'));
    ctx.session.lastBotMessage = sendMessage.message_id;
  }

  @Action(/^decline_invite:\d+$/)
  async declineInvite(ctx: IContext) {
    this.logger.log('Executing declineInvite');
    const userId = ctx.from.id;
    if (ctx.session.group && ctx.session.group.includes(userId)) {
      const index = ctx.session.group.indexOf(userId);
      ctx.session.group.splice(index, 1);
    }
    const sendMessage = await ctx.telegram.sendMessage(
      userId,
      FAMILY_TEXT[ctx.session.language || 'ua'].INVITATION_DECLINED,
      groupButton(ctx.session.language || 'ua'),
    );
    ctx.session.lastBotMessage = sendMessage.message_id;
  }

  @Action('remove_group')
  async deleteGroup(ctx: IContext) {
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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
    if (await checkAndUpdateLastBotMessage(ctx)) {
      return;
    }
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
