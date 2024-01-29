import { Action, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { OpenAiApiService } from '../open-ai-api/open-ai-api.service';
import { CustomCallbackQuery, IContext } from '../interface';
import {
  actionButtonsBeckP,
  actionButtonsBeckPAndRemove,
  actionButtonsGptMenu,
  actionButtonsPremiumMenu,
  actionButtonsStatistics,
  backStartButton,
} from '../battons';
import {
  BAY_PREMIUM_MENU,
  COMPARE_DELL,
  DELETE_COMPARE_DATA,
  getPremiumMessage,
  GPT_MENU,
  NOT_COMPARE,
} from '../constants';

@Update()
export class CompareHandler {
  private readonly logger: Logger = new Logger(CompareHandler.name);
  constructor(private readonly openAiApiService: OpenAiApiService) {}

  @Action('compare')
  async compare(ctx: IContext) {
    this.logger.log(`user: ${ctx.from.id} compare`);
    const customCallbackQuery: CustomCallbackQuery = ctx.callbackQuery as CustomCallbackQuery;
    if (ctx.session.compare.length >= 2) {
      await ctx.editMessageText(
        `${COMPARE_DELL[ctx.session.language]}`,
        actionButtonsStatistics(ctx.session.language || 'ua'),
      );
    } else {
      ctx.session.compare.push(customCallbackQuery.message.text + '\n');
      await ctx.editMessageText(
        `${getPremiumMessage(ctx.session.language, ctx.session.compare.length)} `,
        actionButtonsStatistics(ctx.session.language || 'ua'),
      );
    }
  }
  @Action('get_compare')
  async get_compare(ctx: IContext) {
    await ctx.editMessageText('💭');
    this.logger.log(`user: ${ctx.from.id} get_compare`);
    // Generate a summarization response using the OpenAI service
    const message = await this.openAiApiService.generateResponse([
      {
        role: 'assistant',
        content: `отвечай на${ctx.session.language} языке,
         посмотри на данные и дай совет по финансам: 
        ${ctx.session.compare[0]} и ${ctx.session.compare[1]}`,
      },
    ]);
    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: backStartButton().reply_markup,
    });
    ctx.session.compare = [];
  }
  @Action('see_compare')
  async see_compare(ctx: IContext) {
    this.logger.log(`user: ${ctx.from.id} see_compare`);
    const message = ctx.session.compare;
    if (message[0] === undefined) {
      await ctx.editMessageText(`${NOT_COMPARE[ctx.session.language || 'ua']}`, {
        parse_mode: 'HTML',
        reply_markup: actionButtonsBeckP(ctx.session.language).reply_markup,
      });
    } else {
      await ctx.editMessageText(`${message[0]}\n${message[1]}`, {
        parse_mode: 'HTML',
        reply_markup: actionButtonsBeckPAndRemove(ctx.session.language || 'ua').reply_markup,
      });
    }
  }

  @Action('gpt')
  async gpt(ctx: IContext) {
    this.logger.log(`user: ${ctx.from.id} gpt`);
    await ctx.editMessageText(`${GPT_MENU[ctx.session.language || 'ua']}`, {
      parse_mode: 'HTML',
      reply_markup: actionButtonsGptMenu(ctx.session.language).reply_markup,
    });
  }
  @Action('backP')
  async backP(ctx: IContext) {
    this.logger.log(`user: ${ctx.from.id} gpt`);
    await ctx.editMessageText(`${BAY_PREMIUM_MENU[ctx.session.language || 'ua']}`, {
      reply_markup: actionButtonsPremiumMenu(ctx.session.language).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }
  @Action('compare_remove')
  async compare_remove(ctx: IContext) {
    this.logger.log(`user: ${ctx.from.id} compare_remove`);
    ctx.session.compare = [];
    await ctx.editMessageText(`${DELETE_COMPARE_DATA[ctx.session.language || 'ua']}`, {
      reply_markup: actionButtonsPremiumMenu(ctx.session.language).reply_markup,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    });
  }
}
