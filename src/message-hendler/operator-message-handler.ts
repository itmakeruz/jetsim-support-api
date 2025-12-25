import { PrismaService } from 'src/prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { BadRequestException, Injectable } from '@nestjs/common';
import { sendMessageDto } from 'src/message-hendler/dto/sendMessageDto';
import { ContentType, EmitTypes, StatusTypes } from 'src/dto/types';
import { Message } from 'src/dto/openTicketDto';
import { SendMessageResponse } from './emitsmodel/sendmessage-response';
import { WsException } from '@nestjs/websockets';
import { OperatorRequest } from 'src/dto/operatorModel';
import { TicketModel, UserModel } from 'src/operator/responses';
import { message_notfound, ticket_notfound, ticket_opened_error, unable_user_error, user_blocked } from 'src/dictonary';
import { async } from 'rxjs';
import { TelegramBotService } from 'src/telegram-bot/telegram-bot.service';
import { botSendMesssage } from 'src/telegram-bot/hendlers/botsender';
import { TicketHelper } from './ticket-notification';
import { ConfigService } from '@nestjs/config';
import { Helper } from 'src/helper/helper';

@Injectable()
export class OperatorMessageHendler {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private ticketHelper: TicketHelper,
  ) {}

  async sendMessage(data: sendMessageDto, client: Socket, server: Server) {
    let lang = client.handshake?.headers?.lang?.toString() || 'ru';
    let user: OperatorRequest = client['user'];
    let newMessage: Message | any = { content: data.message };

    let operator = await this.prisma.operators.findFirst({
      where: { id: user.user_id },
      select: {
        user_id: true,
        tickets: { where: { id: data.ticket_id }, select: { user: true } },
      },
    });
    let ticket = await this.prisma.tickets.findFirst({
      where: { id: data.ticket_id },
      select: { id: true, user: true, operator_id: true },
    });

    if (!ticket)
      return server.to(client.id).emit(EmitTypes.EXCEOPTION, {
        status: 403,
        error: 'Bad Request',
        message: ticket_notfound[lang],
      });
    if (ticket?.operator_id != null && ticket?.operator_id != user.user_id)
      return server.to(client.id).emit(EmitTypes.EXCEOPTION, {
        status: 403,
        error: 'Bad Request',
        message: ticket_opened_error[lang],
      });
    if (!operator.user_id)
      return server.to(client.id).emit(EmitTypes.EXCEOPTION, {
        status: 403,
        error: 'Bad Request',
        message: unable_user_error[lang],
      });
    let sendmessage: Message = { content: data.message };
    await this.prisma.tickets.update({
      where: { id: data.ticket_id },
      data: { operator_id: user.user_id },
    });
    if (data?.reply_message_id) {
      let message = await this.prisma.messages.findFirst({
        where: { id: data.reply_message_id },
        select: {
          id: true,
          message: true,
          content_type: true,
          bot_id: true,
          is_answer: true,
          user: true,
          operator: true,
        },
      });
      if (!message)
        server.to(client.id).emit(EmitTypes.EXCEOPTION, {
          status: 403,
          error: 'Bad Request',
          message: message_notfound[lang],
        });
      newMessage.reply_message_id = message.id;
      Object(ticket.user.action)?.is_telegram_user ? (sendmessage.reply_bot_message_id = Number(message.bot_id)) : null;
      sendmessage.reply_message_id = data.reply_message_id;
      sendmessage.reply_content = {
        content: Object(message.message)?.content,
        content_type: message.content_type,
        author: message.is_answer == 0 ? message.user.name : message.operator.first_name,
      };
    }

    let contentType = data.reply_message_id ? ContentType.REPLYTEXT : ContentType.TEXT;
    console.log(operator);

    let createdMessage = await this.prisma.messages.create({
      data: {
        user_id: operator.user_id,
        is_answer: 1,
        operator_id: user.user_id,
        content_type: contentType,
        ticket_id: data.ticket_id,
        message: newMessage,
      },
      select: {
        user: {
          select: {
            messages: true,
            id: true,
            chat_id: true,
            name: true,
            phone_number: true,
            is_block: true,
            is_online: true,
            socket_id: true,
            switch_ticket_id: true,
            updated_at: true,
            action: true,
          },
        },
        id: true,
        message: true,
        created_at: true,
        is_answer: true,
        content_type: true,
        is_ready: true,
      },
    });

    let updated = await this.prisma.users.update({
      where: { id: createdMessage.user.id },
      data: { last_message: data.message, updated_at: new Date() },
    });

    let clientSocketId = createdMessage.user.switch_ticket_id === data.ticket_id ? createdMessage.user.socket_id : '';
    let responseData: SendMessageResponse = {
      id: createdMessage.id,
      message: sendmessage,
      formatted_time: createdMessage.created_at.toLocaleTimeString(),
      date: createdMessage.created_at,
      base_url: this.config.get('FILES_BASE_URL'),
      is_answer: createdMessage.is_answer,
      author: user.name,
      content_type: createdMessage.content_type,
      is_ready: createdMessage.is_ready,
    };

    let operators = await this.prisma.operators.findMany({
      where: { is_active: true },
    });
    if (Object(createdMessage.user.action)?.is_telegram_user) {
      let response = await botSendMesssage('sendMessage', {
        chat_id: createdMessage.user.chat_id,
        text: sendmessage.content,
        reply_to_message_id: sendmessage.reply_bot_message_id,
      });
      if (response?.['ok'] === false) {
        newMessage.content = user_blocked[lang] + '\n\n' + newMessage.content;
        sendmessage.content = user_blocked[lang] + '\n\n' + sendmessage.content;
        await this.prisma.messages.update({
          where: { id: createdMessage.id },
          data: { message: newMessage },
        });
      } else {
        await this.prisma.messages.update({
          where: { id: createdMessage.id },
          data: { bot_id: response.message_id },
        });
      }
    }

    let messages = await this.prisma.messages.count({
      where: { user_id: createdMessage.user.id, is_ready: false, is_answer: 0 },
    });

    operators.forEach((operator) => {
      let user: UserModel = {
        id: createdMessage.user.id,
        chat_id: createdMessage.user.chat_id,
        name: createdMessage.user.name,
        last_message: newMessage,
        date: Helper.formatByMonthName(createdMessage.user.updated_at, 'ru'),
        phone: createdMessage.user.phone_number,
        is_block: createdMessage.user.is_block,
        is_online: createdMessage.user.is_online,
        push: messages,
        ticket_id: ticket.id,
      };
      server.to(operator.socket_id).emit(EmitTypes.NOTIFICATION, user);
    });

    await this.prisma.tickets.update({
      where: { id: ticket.id },
      data: { status: StatusTypes.ANSWERED },
    });
    this.ticketHelper.notification(server, ticket.id);
    server.to(client.id).emit(EmitTypes.NEWMESSAGE, responseData);
    server.to(clientSocketId?.toString()).emit(EmitTypes.NEWMESSAGE, responseData);
  }
}
