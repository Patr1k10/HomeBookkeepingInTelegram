import { Markup } from 'telegraf';
import { BUTTONS } from '../constants';

export function familyButton(language: string = 'ua') {
  return Markup.inlineKeyboard(
    [
      Markup.button.callback(BUTTONS[language].GET_ID, 'get_id'),
      Markup.button.callback(BUTTONS[language].ADD_TO_GROUP, 'add_to_group'),
      Markup.button.callback(BUTTONS[language].DELETE_FROM_GROUP, 'remove_group'),
      Markup.button.callback(BUTTONS[language].HELP, 'help'),
      Markup.button.callback(BUTTONS[language].BACK, 'back'),
    ],
    {
      columns: 2,
    },
  );
}

export function acceptButton(language: string = 'ua', recipientId: number) {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].ACCEPT, `accept_user:${recipientId}`)]);
}

export function backFamilyButton(language: string = 'ua') {
  return Markup.inlineKeyboard([Markup.button.callback(BUTTONS[language].BACK, 'backF')]);
}
