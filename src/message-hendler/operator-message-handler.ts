import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { sendMessageDto } from 'src/message-hendler/dto/sendMessageDto';
import { ContentType, EmitTypes, StatusTypes } from 'src/dto/types';
import { Message } from 'src/dto/openTicketDto';
import { SendMessageResponse } from './emitsmodel/sendmessage-response';
import { OperatorRequest } from 'src/dto/operatorModel';
import { UserModel } from 'src/operator/responses';
import { message_notfound, ticket_notfound, ticket_opened_error, user_blocked } from 'src/dictonary';
import { botSendMesssage } from 'src/telegram-bot/hendlers/botsender';
import { TicketHelper } from './ticket-notification';
import { ConfigService } from '@nestjs/config';
import { Helper } from 'src/helper/helper';
import { Prisma } from '@prisma/client';

@Injectable()
export class OperatorMessageHendler {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private ticketHelper: TicketHelper,
  ) {}

  async sendMessage(data: sendMessageDto, client: Socket, server: Server) {
    const lang = client.handshake?.headers?.lang?.toString() || 'ru';
    const actor: OperatorRequest = client['user'];
    const operatorId = actor?.user_id;
    if (!operatorId) return this.emitError(server, client.id, 'Unauthorized');

    const ticket = await this.prisma.tickets.findUnique({
      where: { id: data.ticket_id },
      select: {
        id: true,
        user_id: true,
        operator_id: true,
        user: { select: { action: true } },
      },
    });
    if (!ticket) return this.emitError(server, client.id, ticket_notfound[lang]);
    if (ticket.operator_id !== null && ticket.operator_id !== operatorId) {
      return this.emitError(server, client.id, ticket_opened_error[lang]);
    }

    const newMessage: Message & { reply_message_id?: number } = { content: data.message };
    const sendMessage: Message = { content: data.message };
    if (data.reply_message_id) {
      const reply = await this.prisma.messages.findFirst({
        where: { id: data.reply_message_id, ticket_id: ticket.id, deleted: false },
        select: {
          id: true,
          message: true,
          content_type: true,
          bot_id: true,
          is_answer: true,
          user: { select: { name: true } },
          operator: { select: { first_name: true } },
        },
      });
      if (!reply) return this.emitError(server, client.id, message_notfound[lang]);

      newMessage.reply_message_id = reply.id;
      sendMessage.reply_message_id = reply.id;
      if (Object(ticket.user.action)?.is_telegram_user && reply.bot_id) {
        sendMessage.reply_bot_message_id = Number(reply.bot_id);
      }
      sendMessage.reply_content = {
        content: Object(reply.message)?.content,
        content_type: reply.content_type,
        author: reply.is_answer === 0 ? reply.user?.name : reply.operator?.first_name,
      };
    }

    const contentType = data.reply_message_id ? ContentType.REPLYTEXT : ContentType.TEXT;
    const createdMessage = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.tickets.updateMany({
        where: { id: ticket.id, OR: [{ operator_id: null }, { operator_id: operatorId }] },
        data: { operator_id: operatorId, status: StatusTypes.ANSWERED },
      });
      if (!claimed.count) return null;

      const message = await tx.messages.create({
        data: {
          // The ticket is the only source of truth for the recipient.
          user_id: ticket.user_id,
          is_answer: 1,
          operator_id: operatorId,
          content_type: contentType,
          ticket_id: ticket.id,
          message: newMessage as unknown as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          created_at: true,
          is_answer: true,
          content_type: true,
          is_ready: true,
          user: {
            select: {
              id: true,
              chat_id: true,
              name: true,
              phone_number: true,
              is_block: true,
              is_online: true,
              action: true,
            },
          },
        },
      });
      await tx.users.update({ where: { id: ticket.user_id }, data: { last_message: data.message } });
      return message;
    });
    if (!createdMessage) return this.emitError(server, client.id, ticket_opened_error[lang]);

    const responseData: SendMessageResponse = {
      ticket_id: ticket.id,
      id: createdMessage.id,
      message: sendMessage,
      formatted_time: Helper.formatMessageTime(createdMessage.created_at),
      date: createdMessage.created_at,
      base_url: this.config.get('FILES_BASE_URL'),
      is_answer: createdMessage.is_answer,
      author: actor.name,
      content_type: createdMessage.content_type,
      is_ready: createdMessage.is_ready,
    };

    if (Object(createdMessage.user.action)?.is_telegram_user) {
      const response = await botSendMesssage('sendMessage', {
        chat_id: createdMessage.user.chat_id,
        text: sendMessage.content,
        reply_to_message_id: sendMessage.reply_bot_message_id,
      });
      if (response?.['ok'] === false) {
        newMessage.content = user_blocked[lang] + '\n\n' + newMessage.content;
        sendMessage.content = newMessage.content;
        await this.prisma.messages.update({
          where: { id: createdMessage.id },
          data: { message: newMessage as unknown as Prisma.InputJsonValue },
        });
      } else if (response?.message_id) {
        await this.prisma.messages.update({ where: { id: createdMessage.id }, data: { bot_id: response.message_id } });
      }
    }

    const unreadMessages = await this.prisma.messages.count({
      where: { user_id: ticket.user_id, is_ready: false, is_answer: 0 },
    });
    const notification: UserModel = {
      id: createdMessage.user.id,
      chat_id: createdMessage.user.chat_id,
      name: createdMessage.user.name,
      last_message: newMessage,
      date: Helper.formatByMonthName(createdMessage.created_at, 'ru'),
      phone: createdMessage.user.phone_number,
      is_block: createdMessage.user.is_block,
      is_online: createdMessage.user.is_online,
      push: unreadMessages,
      ticket_id: ticket.id,
    };
    const activeOperators = await this.prisma.operators.findMany({
      where: { is_active: true },
      select: { id: true },
    });
    for (const operator of activeOperators) {
      server.to(`operator:${operator.id}`).emit(EmitTypes.NOTIFICATION, notification);
    }

    await this.ticketHelper.notification(server, ticket.id);
    server.to(`operator:${operatorId}`).emit(EmitTypes.NEWMESSAGE, responseData);
    server.to(`user:${ticket.user_id}`).emit(EmitTypes.NEWMESSAGE, responseData);
    return { ok: true, data: responseData };
  }

  private emitError(server: Server, socketId: string, message: string) {
    const payload = { status: 403, error: 'Bad Request', message };
    server.to(socketId).emit(EmitTypes.EXCEOPTION, payload);
    return { ok: false, error: payload };
  }
}
