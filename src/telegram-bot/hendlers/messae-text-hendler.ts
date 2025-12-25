import { Injectable } from '@nestjs/common';
import * as http from 'https';
import * as TelegramBotAPI from 'node-telegram-bot-api';
import { button } from '../menu/static-menu';
import { contact, download, download_description, else_message, success_txt, tickets_txt } from '../../dictonary';
import { PrismaService } from 'src/prisma/prisma.service';
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { Users } from '@prisma/client';
import { actionModel } from './dto/actionModel';
import { ContentType, EmitTypes, StatusTypes } from 'src/dto/types';
import { AppService } from 'src/app.service';
import { sendMessageDto } from 'src/message-hendler/dto/sendMessageDto';
import { Message } from 'src/dto/openTicketDto';
import { SendMessageResponse } from 'src/message-hendler/emitsmodel/sendmessage-response';
import { TicketModel, UserModel } from 'src/operator/responses';
import { SocketGateway } from 'src/app.gateway';
import { DinamicButton } from '../menu/dinamic-menu';
import { BadRequestExceptionResponse, OpenTicketResponse } from 'src/responses/AppServiceResponse';
import { OperatorRequest } from 'src/dto/operatorModel';
import { Server, Socket } from 'socket.io';
import { TicketHelper } from 'src/message-hendler/ticket-notification';
import { ConfigService } from '@nestjs/config';
import { MyHttpService } from 'src/http/http.service';
import { botSendMesssage } from './botsender';
import { Helper } from 'src/helper/helper';

@Injectable()
export class MessageTextHandler {
  constructor(
    private prisma: PrismaService,
    private socket: SocketGateway,
    private clientService: AppService,
    private config: ConfigService,
    private httpService: MyHttpService,
    private DinamicButton: DinamicButton,
    private TicketHelper: TicketHelper,
  ) {}

  public async text(bot: TelegramBotAPI, msg: TelegramBotAPI.Message) {
    const chat_id = msg.from.id;
    const text = msg.text;
    const reply_message_id = msg?.reply_to_message?.message_id;
    let user = await this.prisma.users.findUnique({
      where: { chat_id: chat_id.toString() },
    });
    let action: actionModel = Object(user?.action);
    if (text == '/start') {
      if (!user) this.createUser(bot, msg);
      return bot.sendMessage(
        chat_id,
        '👋 *Здравствуйте и добро пожаловать в официальный бот приложения Jet Sim! Выберите желаемый язык*\n\n👋 *Hello and welcome to the official bot of the JetSim application! Select the desired language*',
        { parse_mode: 'Markdown', reply_markup: button('language') },
      );
    } else if (download.includes(text)) {
      return bot.sendMessage(chat_id, download_description[user?.lang || 'uz'], {
        parse_mode: 'Markdown',
        reply_markup: button('app_link'),
      });
    } else if (contact.includes(text)) {
      action.step = 'ticket';
      let updateUser = await this.prisma.users.update({
        where: { chat_id: chat_id.toString() },
        data: { action: Object(action) },
      });
      return bot.sendMessage(chat_id, tickets_txt[user.lang], {
        parse_mode: 'Markdown',
        reply_markup: await this.DinamicButton.ticket_buttons(user),
      });
    } else if (action?.step == 'answer') {
      if (!action.category_id.toString().startsWith('_')) {
        try {
          let ticket: OpenTicketResponse | any = await this.clientService.openTicket(
            {
              category_id: Number(action.category_id),
              message: text,
              bot_message_id: msg.message_id,
            },
            { phone: user.phone_number, uuid: user.chat_id },
            user?.lang || 'uz',
          );
          action.ticket_id = Number(ticket.data.id);
          action.step = 'operator';
          await this.prisma.users.update({
            where: { chat_id: chat_id.toString() },
            data: { action: Object(action) },
          });
          return bot.sendMessage(chat_id, success_txt[user?.lang || 'uz']);
        } catch (error) {
          bot.sendMessage(chat_id, 'Error');
        }
      } else {
        let category_id = action.category_id.toString().split('_')[1];
        action.ticket_id = Number(category_id);
        action.step = 'operator';
        let user = await this.prisma.users.update({
          where: { chat_id: chat_id.toString() },
          data: { action: Object(action) },
        });

        let payload: sendMessageDto = {
          message: text,
          ticket_id: action.ticket_id,
        };
        if (reply_message_id) payload.reply_message_id = reply_message_id;
        this.createMessage(payload, chat_id.toString(), msg.message_id);
        // await botSendMesssage('sendMessage', {
        //   chat_id: '-1002461316093',
        //   text: `Foydalanuvchi chatga yozdi: ${user.phone_number}\n\n<i>${text}</i>`,
        //   parse_mode: 'HTML',
        // });
        return bot.sendMessage(chat_id, success_txt[user?.lang || 'uz']);
      }
    } else if (action?.step == 'operator') {
      let payload: sendMessageDto = {
        message: text,
        ticket_id: action.ticket_id,
      };
      if (reply_message_id) payload.reply_message_id = reply_message_id;
      this.createMessage(payload, chat_id.toString(), msg.message_id);
    } else {
      return bot.sendMessage(chat_id, else_message[user?.lang || 'uz']);
    }
  }

  private async createUser(bot: TelegramBotAPI, msg: TelegramBotAPI.Message): Promise<Users> {
    let chat_id = msg.from.id;
    let firs_name = msg.from.first_name;

    if (!existsSync('files/' + chat_id)) {
      mkdirSync('files/' + chat_id, { recursive: true });
    }

    let img = await bot.getUserProfilePhotos(chat_id, { limit: 1 });
    let file_id = img.photos.length ? img.photos[0][img.photos[0].length - 1]?.file_id : false;

    if (file_id) {
      let file_link = await bot.getFileLink(file_id);
      let payload = {
        filename: 'profile-image',
        folder: 'support/' + chat_id,
        link: file_link,
      };
      const credentials = Buffer.from(`${process.env.FILE_UPLOAD_LOGIN}:${process.env.FILE_UPLOAD_PASSWORD}`).toString(
        'base64',
      );

      let response = await this.httpService.post(process.env.FILE_UPLOAD_SERVICE_URL + 'by-link', payload, {
        headers: { Authorization: `Basic ${credentials}` },
      });

      let created = await this.prisma.users.create({
        data: {
          name: firs_name,
          chat_id: chat_id.toString(),
          photo: response.data?.path ?? '',
          is_online: true,
          action: { is_telegram_user: true },
        },
      });

      return created;
    } else {
      let imgPath = chat_id + '/default.jpg';
      writeFileSync(
        join(process.cwd(), 'files/' + chat_id, 'default.jpg'),
        readFileSync('src/telegram-bot/hendlers/img/default.jpg'),
      );
      let created = await this.prisma.users.create({
        data: {
          name: firs_name,
          chat_id: chat_id.toString(),
          photo: imgPath,
          is_online: true,
          action: { is_telegram_user: true },
        },
      });
      return created;
    }
  }

  async createMessage(data: sendMessageDto, chat_id: string, message_id: number) {
    const { message, ticket_id, reply_message_id, content_type } = data;
    let newMessage: Message | any = { content: message };
    let siwitchOperators = await this.prisma.operators.findMany({
      where: { AND: { ticket_id: ticket_id, is_active: true } },
    });

    let userData = await this.prisma.users.findUnique({
      where: { chat_id: chat_id },
    });

    let sendmessage: Message = { content: data.message };
    if (reply_message_id) {
      let message = await this.prisma.messages.findFirst({
        where: { bot_id: reply_message_id },
        select: {
          id: true,
          message: true,
          content_type: true,
          is_answer: true,
          user: true,
          operator: true,
        },
      });
      if (message) {
        newMessage.reply_message_id = message?.id;
        sendmessage.reply_message_id = data.reply_message_id;
        sendmessage.reply_content = {
          content: Object(message.message)?.content,
          content_type: message.content_type,
          author: message.is_answer == 0 ? message.user.name : message.operator.first_name,
        };
      }
    }

    let contentType = reply_message_id ? ContentType.REPLYTEXT : content_type ? content_type : ContentType.TEXT;
    let createdMessage = await this.prisma.messages.create({
      data: {
        user_id: userData.id,
        is_answer: 0,
        content_type: contentType,
        ticket_id: ticket_id,
        message: newMessage,
        bot_id: message_id,
        is_ready: siwitchOperators.length ? true : false,
      },
      select: {
        id: true,
        message: true,
        content_type: true,
        created_at: true,
        is_answer: true,
        user: {
          select: {
            id: true,
            chat_id: true,
            name: true,
            phone_number: true,
            is_block: true,
            is_online: true,
            messages: true,
            updated_at: true,
          },
        },
        is_ready: true,
      },
    });

    let responseData: SendMessageResponse = {
      id: createdMessage.id,
      message: sendmessage,
      formatted_time: createdMessage.created_at.toLocaleTimeString(),
      date: createdMessage.created_at,
      base_url: this.config.get('FILES_BASE_URL'),
      is_answer: createdMessage.is_answer,
      author: createdMessage.user.name,
      content_type: createdMessage.content_type,
      is_ready: createdMessage.is_ready,
    };
    for (const operator of siwitchOperators) {
      this.socket.server.to(operator.socket_id).emit(EmitTypes.NEWMESSAGE, responseData);
    }
    this.TicketHelper.notification(this.socket.server, ticket_id);
    newMessage.content = contentType == ContentType.TEXT ? newMessage.content : contentType;
    await this.prisma.tickets.update({
      where: { id: ticket_id },
      data: { status: StatusTypes.AWAITING },
    });
    let responseUser: UserModel = {
      id: createdMessage.user.id,
      chat_id: createdMessage.user.chat_id,
      name: createdMessage.user.name,
      last_message: newMessage,
      date: Helper.formatByMonthName(createdMessage.created_at, 'ru'),
      phone: createdMessage.user.phone_number,
      is_block: createdMessage.user.is_block,
      is_online: createdMessage.user.is_online,
      push: createdMessage.user.messages.filter((msg) => msg.is_ready === false && msg.is_answer === 0).length,
      ticket_id: ticket_id,
    };

    this.socket.server.emit(EmitTypes.NOTIFICATION, responseUser);
  }
}
