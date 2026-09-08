import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { sendMessageDto } from 'src/message-hendler/dto/sendMessageDto';
import { ClientRequest } from 'src/dto/clientModel';
import { Message } from 'src/dto/openTicketDto';
import { ContentType, EmitTypes, StatusTypes } from 'src/dto/types';
import { SendMessageResponse } from './emitsmodel/sendmessage-response';
import { UserModel } from 'src/operator/responses/usersModel';
import { TicketHelper } from './ticket-notification';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createMessage as createAiMessage } from './opanai';
import { Helper } from 'src/helper/helper';

@Injectable()
export class ClientMessageHendler {
  constructor(
    private prisma: PrismaService,
    private ticketHelper: TicketHelper,
    private config: ConfigService,
  ) {}

  async sendMessage(data: sendMessageDto, client: Socket, server: Server) {
    const actor: ClientRequest = client['user'];
    if (!actor?.uuid) return this.emitError(server, client.id, 'Unauthorized');

    const [ticket, clientUser] = await Promise.all([
      this.prisma.tickets.findUnique({
        where: { id: data.ticket_id },
        select: { id: true, user_id: true, operator_id: true, category_id: true, last_request_user: true },
      }),
      this.prisma.users.findUnique({ where: { chat_id: actor.uuid } }),
    ]);
    if (!ticket) return this.emitError(server, client.id, 'Ticket not found');
    if (!clientUser || ticket.user_id !== clientUser.id) return this.emitError(server, client.id, 'Access denied');

    const newMessage: Message & { reply_message_id?: number } = { content: data.message };
    const sendMessage: Message = { content: data.message };
    if (data.reply_message_id) {
      const reply = await this.prisma.messages.findFirst({
        where: { id: data.reply_message_id, ticket_id: ticket.id, deleted: false },
        select: {
          id: true,
          message: true,
          content_type: true,
          is_answer: true,
          user: { select: { name: true } },
          operator: { select: { first_name: true } },
        },
      });
      if (!reply) return this.emitError(server, client.id, 'No message found by reply_message_id');
      newMessage.reply_message_id = reply.id;
      sendMessage.reply_message_id = reply.id;
      sendMessage.reply_content = {
        content: Object(reply.message)?.content,
        content_type: reply.content_type,
        author: reply.is_answer === 0 ? reply.user?.name : reply.operator?.first_name,
      };
    }

    const operatorIsViewingTicket = ticket.operator_id
      ? await this.prisma.operators.findFirst({
          where: { id: ticket.operator_id, ticket_id: ticket.id, is_active: true },
          select: { id: true },
        })
      : null;
    const contentType = data.reply_message_id ? ContentType.REPLYTEXT : ContentType.TEXT;
    const createdMessage = await this.prisma.$transaction(async (tx) => {
      const message = await tx.messages.create({
        data: {
          user_id: ticket.user_id,
          is_answer: 0,
          content_type: contentType,
          ticket_id: ticket.id,
          message: newMessage as unknown as Prisma.InputJsonValue,
          is_ready: Boolean(operatorIsViewingTicket),
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
              messages: true,
            },
          },
        },
      });
      await tx.users.update({ where: { id: ticket.user_id }, data: { last_message: data.message } });
      await tx.tickets.update({ where: { id: ticket.id }, data: { status: StatusTypes.AWAITING } });
      return message;
    });

    const responseData: SendMessageResponse = {
      ticket_id: ticket.id,
      id: createdMessage.id,
      message: sendMessage,
      formatted_time: Helper.formatMessageTime(createdMessage.created_at),
      date: createdMessage.created_at,
      base_url: this.config.get('FILES_BASE_URL'),
      is_answer: createdMessage.is_answer,
      author: createdMessage.user.name,
      content_type: createdMessage.content_type,
      is_ready: createdMessage.is_ready,
    };
    await this.ticketHelper.notification(server, ticket.id);
    server.to(`user:${ticket.user_id}`).emit(EmitTypes.NEWMESSAGE, responseData);
    if (ticket.operator_id) server.to(`operator:${ticket.operator_id}`).emit(EmitTypes.NEWMESSAGE, responseData);

    const notification: UserModel = {
      id: createdMessage.user.id,
      chat_id: createdMessage.user.chat_id,
      name: createdMessage.user.name,
      last_message: newMessage,
      date: Helper.formatByMonthName(createdMessage.created_at, 'ru'),
      phone: createdMessage.user.phone_number,
      is_block: createdMessage.user.is_block,
      is_online: createdMessage.user.is_online,
      push: createdMessage.user.messages.filter((item) => item.is_answer === 0 && !item.is_ready).length,
      ticket_id: ticket.id,
    };
    server.emit(EmitTypes.NOTIFICATION, notification);

    if (ticket.category_id === 9 && ticket.last_request_user) {
      const answer = await createAiMessage(ticket.last_request_user, data.message, createdMessage.user.chat_id);
      if (answer) await this.createMessage(answer, server, createdMessage.user, ticket.id);
    }
    return { ok: true, data: responseData };
  }

  async createMessage(message: string, server: Server, userData: { id: number }, ticketId: number) {
    const sendMessage: Message = { content: message };
    const createdMessage = await this.prisma.messages.create({
      data: {
        user_id: userData.id,
        is_answer: 1,
        content_type: ContentType.TEXT,
        ticket_id: ticketId,
        message: sendMessage as unknown as Prisma.InputJsonValue,
        operator_id: 1,
        is_ready: true,
      },
      select: {
        id: true,
        created_at: true,
        is_answer: true,
        content_type: true,
        is_ready: true,
        operator: { select: { first_name: true } },
      },
    });
    const responseData: SendMessageResponse = {
      ticket_id: ticketId,
      id: createdMessage.id,
      message: sendMessage,
      formatted_time: Helper.formatMessageTime(createdMessage.created_at),
      date: createdMessage.created_at,
      base_url: this.config.get('FILES_BASE_URL'),
      is_answer: createdMessage.is_answer,
      author: createdMessage.operator?.first_name || 'AI',
      content_type: createdMessage.content_type,
      is_ready: createdMessage.is_ready,
    };
    server.to(`user:${userData.id}`).emit(EmitTypes.NEWMESSAGE, responseData);
  }

  private emitError(server: Server, socketId: string, message: string) {
    const payload = { status: 403, error: 'Bad Request', message };
    server.to(socketId).emit(EmitTypes.EXCEOPTION, payload);
    return { ok: false, error: payload };
  }
}
