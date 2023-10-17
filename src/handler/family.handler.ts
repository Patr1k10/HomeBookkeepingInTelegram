import { Action, Command, Hears, Update } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { IContext } from '../interface/context.interface';
import { groupButton } from '../battons/app.buttons';
import { MyMessage } from '../interface/my-message.interface';

@Update()
export class FamilyHandler {
  private readonly logger: Logger = new Logger(FamilyHandler.name);
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
    // Инициализация массива group, если он пуст
    if (!ctx.session.group) {
      ctx.session.group = [];
    }
    // Добавление id в массив
    if (!ctx.session.group.includes(userId)) {
      ctx.session.group.push(userId);
    }
    await ctx.reply('Группа создана, ваш ID добавлен');
  }

  @Action('add_to_group')
  async addToGroup(ctx: IContext) {
    // Запрос на ввод ID
    await ctx.reply('Пожалуйста, введите ID пользователя, который вы хотите добавить в группу.');
    ctx.session.awaitingUserIdInput = true;
  }
  @Hears(/^\d+$/) // Регулярное выражение для матчинга только чисел
  async addUserId(ctx: IContext) {
    // Проверяем, ожидаем ли мы ввод ID
    if (ctx.session.awaitingUserIdInput) {
      const message = ctx.message as MyMessage;
      const inputId = parseInt(message.text, 10);

      // Инициализация массива group, если он пуст
      if (!ctx.session.group) {
        ctx.session.group = [];
      }

      // Добавление ID в массив
      if (!ctx.session.group.includes(inputId)) {
        ctx.session.group.push(inputId);
        await ctx.reply(`ID ${inputId} успешно добавлен в группу.`);
      } else {
        await ctx.reply(`ID ${inputId} уже есть в группе.`);
      }

      // Сброс флага
      ctx.session.awaitingUserIdInput = false;
    }
  }

  @Action('live_group')
  async liveGroup(ctx: IContext) {
    const userId = ctx.from.id;

    // Проверяем, существует ли массив group и содержит ли он ID пользователя
    if (ctx.session.group && ctx.session.group.includes(userId)) {
      const index = ctx.session.group.indexOf(userId);

      // Удаляем ID пользователя из массива
      ctx.session.group.splice(index, 1);
      await ctx.reply('Вы успешно покинули группу.');
    } else {
      await ctx.reply('Вы не являетесь частью какой-либо группы.');
    }
  }

  @Action('delete_group')
  async deleteGroup(ctx: IContext) {
    // Проверяем, существует ли массив group и не пуст ли он
    if (ctx.session.group && ctx.session.group.length > 0) {
      // Очищаем массив
      ctx.session.group = [];
      await ctx.reply('Группа успешно удалена.');
    } else {
      await ctx.reply('Группа уже пуста или не существует.');
    }
  }
}
