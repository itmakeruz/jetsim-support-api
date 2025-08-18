import { Injectable } from '@nestjs/common';
import * as TelegramBotAPI from 'node-telegram-bot-api';
import { button } from '../menu/static-menu';
import { PrismaService } from 'src/prisma/prisma.service';
import { answer_txt, home_txt } from '../../dictonary';
import { actionModel } from './dto/actionModel';

@Injectable()
export class CallbackQueryHandler {
  constructor(private prisma: PrismaService) {}

  public async data(bot: TelegramBotAPI, msg: TelegramBotAPI.CallbackQuery) {
    const chat_id = msg.from.id;
    let data = msg.data;
    let user = await this.prisma.users.findUnique({ where: { chat_id: chat_id.toString() } });
    let action: actionModel = Object(user?.action);
    if (['uz', 'ru', 'en'].includes(data)) {
      bot.deleteMessage(chat_id, msg.message.message_id);
      bot.sendMessage(chat_id, home_txt[data], {
        parse_mode: 'Markdown',
        reply_markup: button(user?.phone_number ? 'home2' : 'home', data),
      });
      await this.prisma.users.update({ where: { chat_id: chat_id.toString() }, data: { lang: data, is_online: true } });
    } else if (action?.step == 'ticket') {
      ((action.category_id = data), (action.step = 'answer'));
      let updateUser = await this.prisma.users.update({
        where: { chat_id: chat_id.toString() },
        data: { action: Object(action) },
      });
      bot.deleteMessage(chat_id, msg.message.message_id);
      bot.sendMessage(chat_id, answer_txt[updateUser.lang || 'uz'], { reply_markup: button('home2', updateUser.lang) });
    }
  }
}
