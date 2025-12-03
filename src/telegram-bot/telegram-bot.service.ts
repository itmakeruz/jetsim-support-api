import { Injectable } from '@nestjs/common';
import * as TelegramBotAPI from 'node-telegram-bot-api';
import { button } from './menu/static-menu';
import { MessageTextHandler } from './hendlers/messae-text-hendler';
import { CallbackQueryHandler } from './hendlers/callback-query-hendler';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AppService } from 'src/app.service';
import { max_file_size_error, success_txt, tickets_txt } from '../dictonary';
import { DinamicButton } from './menu/dinamic-menu';
import { actionModel } from './hendlers/dto/actionModel';
import { PrismaNestService } from 'src/prisma/nestjs.prisma.service';
import { OpenTicketResponse } from 'src/responses/AppServiceResponse';
import { sendMessageDto } from 'src/message-hendler/dto/sendMessageDto';
import { MyHttpService } from 'src/http/http.service';
import { ContentType } from 'src/dto/types';
import { saveFileLocal } from '../helper/file-upload.helper';

@Injectable()
export class TelegramBotService {
  private readonly bot: TelegramBotAPI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private DinamicButton: DinamicButton,
    private httpService: MyHttpService,
    private clientService: AppService,
    private message: MessageTextHandler,
    private nest_prisma: PrismaNestService,
    private callback: CallbackQueryHandler,
  ) {
    this.bot = new TelegramBotAPI(this.config.get('TELEGRAM_BOT_TOKEN'), {
      polling: true,
    });
    this.setupBot(this.bot);
  }
  private setupBot(bot: TelegramBotAPI) {
    bot.on('text', (msg) => {
      this.message.text(bot, msg);
    });

    bot.on('callback_query', (msg) => {
      this.callback.data(bot, msg);
    });

    bot.on('contact', async (msg) => {
      const phone_number = msg.contact.phone_number.replace('+', '');
      const chat_id = msg.from.id;

      let user = await this.prisma.users.findUnique({
        where: { chat_id: chat_id.toString() },
      });

      if (!user) {
        let newUser = await this.prisma.users.create({
          data: {
            chat_id: chat_id.toString(),
            phone_number: phone_number,
            lang: 'ru',
            is_online: true,
          },
        });
        user = newUser;
      }

      let action: actionModel = Object(user?.action);
      action.step = 'ticket';
      let updateUser = await this.prisma.users.update({
        where: { chat_id: chat_id.toString() },
        data: { phone_number: phone_number, action: Object(action) },
      });

      bot.sendMessage(chat_id, tickets_txt[updateUser.lang], {
        parse_mode: 'Markdown',
        reply_markup: await this.DinamicButton.ticket_buttons(updateUser),
      });
    });

    bot.on('photo', async (msg) => {
      const chat_id = msg.from.id;

      let user = await this.prisma.users.findUnique({
        where: { chat_id: chat_id.toString() },
      });
      if (msg.photo[msg.photo.length - 1].file_size / 1024 / 1024 > 20)
        return bot.sendMessage(chat_id, max_file_size_error[user.lang]);

      let photo = msg.photo[msg.photo.length - 1];
      let file_link = await bot.getFileLink(photo.file_id);

      let date = new Date();
      let random_id = (100000 + Math.random() * 900000) | 0;

      let payload = {
        filename: `${random_id}`,
        folder:
          'support/' +
          chat_id +
          '/images/' +
          `${date.toLocaleDateString().split('.').join('_')}/${date.toLocaleTimeString('ru-RU', { hour: 'numeric' })}`,
        link: file_link,
      };

      let response = await saveFileLocal(file_link, payload);

      let text = response;
      const reply_message_id = msg?.reply_to_message?.message_id;

      let action: actionModel = Object(user?.action);

      if (action?.step == 'answer') {
        if (!action.category_id.toString().startsWith('_')) {
          try {
            let ticket: OpenTicketResponse | any = await this.clientService.openTicket(
              {
                category_id: Number(action.category_id),
                message: text,
                bot_message_id: msg.message_id,
                content_type: ContentType.PHOTO,
              },
              { phone: user.phone_number, uuid: user.chat_id },
              user?.lang || 'ru',
            );

            action.ticket_id = Number(ticket.data.id);
            action.step = 'operator';
            await this.prisma.users.update({
              where: { chat_id: chat_id.toString() },
              data: { action: Object(action) },
            });
            return bot.sendMessage(chat_id, success_txt[user?.lang || 'ru']);
          } catch (error) {
            bot.sendMessage(chat_id, 'Error');
          }
        } else {
          let category_id = action.category_id.toString().split('_')[1];
          action.ticket_id = Number(category_id);
          action.step = 'operator';
          await this.prisma.users.update({
            where: { chat_id: chat_id.toString() },
            data: { action: Object(action) },
          });

          let payload: sendMessageDto = {
            message: text,
            ticket_id: action.ticket_id,
            content_type: ContentType.PHOTO,
          };
          if (reply_message_id) payload.reply_message_id = reply_message_id;
          await this.message.createMessage(payload, chat_id.toString(), msg.message_id);
          return bot.sendMessage(chat_id, success_txt[user?.lang || 'ru']);
        }
      } else if (action?.step == 'operator') {
        let payload: sendMessageDto = {
          message: text,
          ticket_id: action.ticket_id,
          content_type: ContentType.PHOTO,
        };
        if (reply_message_id) payload.reply_message_id = reply_message_id;
        await this.message.createMessage(payload, chat_id.toString(), msg.message_id);
      }
    });

    bot.on('video', async (msg) => {
      const chat_id = msg.from.id;
      let file_id = msg.video.file_id;

      let user = await this.prisma.users.findUnique({
        where: { chat_id: chat_id.toString() },
      });
      if (msg.video.file_size / 1024 / 1024 > 20) return bot.sendMessage(chat_id, max_file_size_error[user.lang]);

      let file_link = await bot.getFileLink(file_id);
      let date = new Date();
      let random_id = (100000 + Math.random() * 900000) | 0;

      let payload = {
        filename: `${random_id}`,
        folder:
          'support/' +
          chat_id +
          '/videos/' +
          `${date.toLocaleDateString().split('.').join('_')}/${date.toLocaleTimeString('ru-RU', { hour: 'numeric' })}`,
        link: file_link,
      };

      let response = await saveFileLocal(file_link, payload);

      let text = response;
      const reply_message_id = msg?.reply_to_message?.message_id;

      let action: actionModel = Object(user?.action);

      if (action?.step == 'answer') {
        if (!action.category_id.toString().startsWith('_')) {
          try {
            let ticket: OpenTicketResponse | any = await this.clientService.openTicket(
              {
                category_id: Number(action.category_id),
                message: text,
                bot_message_id: msg.message_id,
                content_type: ContentType.VIDEO,
              },
              { phone: user.phone_number, uuid: user.chat_id },
              user?.lang || 'ru',
            );

            action.ticket_id = Number(ticket.data.id);
            action.step = 'operator';
            await this.prisma.users.update({
              where: { chat_id: chat_id.toString() },
              data: { action: Object(action) },
            });
            return bot.sendMessage(chat_id, success_txt[user?.lang || 'ru']);
          } catch (error) {
            bot.sendMessage(chat_id, 'Error');
          }
        } else {
          let category_id = action.category_id.toString().split('_')[1];
          action.ticket_id = Number(category_id);
          action.step = 'operator';
          await this.prisma.users.update({
            where: { chat_id: chat_id.toString() },
            data: { action: Object(action) },
          });

          let payload: sendMessageDto = {
            message: text,
            ticket_id: action.ticket_id,
            content_type: ContentType.VIDEO,
          };
          if (reply_message_id) payload.reply_message_id = reply_message_id;
          await this.message.createMessage(payload, chat_id.toString(), msg.message_id);
          return bot.sendMessage(chat_id, success_txt[user?.lang || 'ru']);
        }
      } else if (action?.step == 'operator') {
        let payload: sendMessageDto = {
          message: text,
          ticket_id: action.ticket_id,
          content_type: ContentType.VIDEO,
        };
        if (reply_message_id) payload.reply_message_id = reply_message_id;
        await this.message.createMessage(payload, chat_id.toString(), msg.message_id);
      }
    });

    bot.on('video_note', async (msg) => {
      console.log(msg);

      const chat_id = msg.from.id;
      let file_id = msg.video_note.file_id;

      let user = await this.prisma.users.findUnique({
        where: { chat_id: chat_id.toString() },
      });
      if (msg.video_note.file_size / 1024 / 1024 > 20) return bot.sendMessage(chat_id, max_file_size_error[user.lang]);

      let file_link = await bot.getFileLink(file_id);
      let date = new Date();
      let random_id = (100000 + Math.random() * 900000) | 0;

      let payload = {
        filename: `${random_id}`,
        folder:
          'support/' +
          chat_id +
          '/videos/' +
          `${date.toLocaleDateString().split('.').join('_')}/${date.toLocaleTimeString('ru-RU', { hour: 'numeric' })}`,
        link: file_link,
      };

      let response = await saveFileLocal(file_link, payload);

      let text = response;
      const reply_message_id = msg?.reply_to_message?.message_id;

      let action: actionModel = Object(user?.action);

      if (action?.step == 'answer') {
        if (!action.category_id.toString().startsWith('_')) {
          try {
            let ticket: OpenTicketResponse | any = await this.clientService.openTicket(
              {
                category_id: Number(action.category_id),
                message: text,
                bot_message_id: msg.message_id,
                content_type: ContentType.VIDEO,
              },
              { phone: user.phone_number, uuid: user.chat_id },
              user?.lang || 'ru',
            );

            action.ticket_id = Number(ticket.data.id);
            action.step = 'operator';
            await this.prisma.users.update({
              where: { chat_id: chat_id.toString() },
              data: { action: Object(action) },
            });
            return bot.sendMessage(chat_id, success_txt[user?.lang || 'ru']);
          } catch (error) {
            bot.sendMessage(chat_id, 'Error');
          }
        } else {
          let category_id = action.category_id.toString().split('_')[1];
          action.ticket_id = Number(category_id);
          action.step = 'operator';
          await this.prisma.users.update({
            where: { chat_id: chat_id.toString() },
            data: { action: Object(action) },
          });

          let payload: sendMessageDto = {
            message: text,
            ticket_id: action.ticket_id,
            content_type: ContentType.VIDEO,
          };
          if (reply_message_id) payload.reply_message_id = reply_message_id;
          await this.message.createMessage(payload, chat_id.toString(), msg.message_id);
          return bot.sendMessage(chat_id, success_txt[user?.lang || 'ru']);
        }
      } else if (action?.step == 'operator') {
        let payload: sendMessageDto = {
          message: text,
          ticket_id: action.ticket_id,
          content_type: ContentType.VIDEO,
        };
        if (reply_message_id) payload.reply_message_id = reply_message_id;
        await this.message.createMessage(payload, chat_id.toString(), msg.message_id);
      }
    });

    bot.on('voice', async (msg) => {
      console.log(msg);

      const chat_id = msg.from.id;
      let file_id = msg.voice.file_id; // ✅ voice uchun to‘g‘ri joy

      let user = await this.prisma.users.findUnique({
        where: { chat_id: chat_id.toString() },
      });

      if (msg.voice.file_size / 1024 / 1024 > 20)
        return bot.sendMessage(chat_id, max_file_size_error[user?.lang || 'ru']);

      let file_link = await bot.getFileLink(file_id);
      let date = new Date();
      let random_id = (100000 + Math.random() * 900000) | 0;

      let payload = {
        filename: `${random_id}`,
        folder:
          'support/' +
          chat_id +
          '/voice/' +
          `${date.toLocaleDateString().split('.').join('_')}/${date.toLocaleTimeString('ru-RU', { hour: 'numeric' })}`,
        link: file_link,
      };

      let response = await saveFileLocal(file_link, payload);

      let text = response;
      const reply_message_id = msg?.reply_to_message?.message_id;

      let action: actionModel = Object(user?.action);

      if (action?.step == 'answer') {
        if (!action.category_id.toString().startsWith('_')) {
          try {
            let ticket: OpenTicketResponse | any = await this.clientService.openTicket(
              {
                category_id: Number(action.category_id),
                message: text,
                bot_message_id: msg.message_id,
                content_type: ContentType.VOICE, // ✅ voice
              },
              { phone: user.phone_number, uuid: user.chat_id },
              user?.lang || 'ru',
            );

            action.ticket_id = Number(ticket.data.id);
            action.step = 'operator';
            await this.prisma.users.update({
              where: { chat_id: chat_id.toString() },
              data: { action: Object(action) },
            });
            return bot.sendMessage(chat_id, success_txt[user?.lang || 'ru']);
          } catch (error) {
            bot.sendMessage(chat_id, 'Error');
          }
        } else {
          let category_id = action.category_id.toString().split('_')[1];
          action.ticket_id = Number(category_id);
          action.step = 'operator';
          await this.prisma.users.update({
            where: { chat_id: chat_id.toString() },
            data: { action: Object(action) },
          });

          let payload: sendMessageDto = {
            message: text,
            ticket_id: action.ticket_id,
            content_type: ContentType.VOICE, // ✅ voice
          };
          if (reply_message_id) payload.reply_message_id = reply_message_id;
          await this.message.createMessage(payload, chat_id.toString(), msg.message_id);
          return bot.sendMessage(chat_id, success_txt[user?.lang || 'ru']);
        }
      } else if (action?.step == 'operator') {
        let payload: sendMessageDto = {
          message: text,
          ticket_id: action.ticket_id,
          content_type: ContentType.VOICE, // ✅ voice
        };
        if (reply_message_id) payload.reply_message_id = reply_message_id;
        await this.message.createMessage(payload, chat_id.toString(), msg.message_id);
      }
    });
  }

  public startBot() {
    this.bot.startPolling();
  }
}
