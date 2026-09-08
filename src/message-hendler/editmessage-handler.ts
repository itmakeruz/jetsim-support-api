import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { editMessageDto } from './dto/sendMessageDto';
import { PrismaService } from 'src/prisma/prisma.service';
import { botSendMesssage } from 'src/telegram-bot/hendlers/botsender';
import { user_blocked } from 'src/dictonary';
import { EmitTypes } from 'src/dto/types';
import { SendMessageResponse } from './emitsmodel/sendmessage-response';
import { ConfigService } from '@nestjs/config';
import { Helper } from 'src/helper/helper';

@Injectable()
export class EditMessage {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async editMessage(data: editMessageDto, client: Socket, server: Server) {
    const lang = client.handshake?.headers?.lang?.toString() || 'ru';
    const message = await this.prisma.messages.findUnique({
      where: { id: data.message_id },
      select: {
        id: true,
        message: true,
        user: { select: { id: true, chat_id: true, name: true } },
        bot_id: true,
        ticket_id: true,
        created_at: true,
        is_answer: true,
        operator: { select: { id: true, first_name: true } },
        operator_id: true,
        content_type: true,
        deleted: true,
      },
    });
    if (!message || message.deleted || !this.isAllowed(client, message)) {
      return this.emitError(server, client.id, 'Access denied');
    }

    const payload = { ...(Object(message.message) as object), content: data.message };
    if (message.bot_id) {
      const response = await botSendMesssage('editMessageText', {
        chat_id: message.user.chat_id,
        message_id: Number(message.bot_id),
        text: data.message,
      });
      if (response?.['ok'] === false) payload.content = user_blocked[lang] + '\n\n' + data.message;
    }
    await this.prisma.messages.update({ where: { id: message.id }, data: { message: payload } });

    const responseData: SendMessageResponse = {
      ticket_id: message.ticket_id,
      id: message.id,
      message: payload as any,
      formatted_time: Helper.formatMessageTime(message.created_at),
      date: message.created_at,
      base_url: this.config.get('FILES_BASE_URL'),
      is_answer: message.is_answer,
      author: message.is_answer ? message.operator?.first_name : message.user.name,
      content_type: message.content_type,
      is_ready: true,
    };
    server.to(`user:${message.user.id}`).emit(EmitTypes.UPDATEMESSAGE, responseData);
    if (message.operator_id) server.to(`operator:${message.operator_id}`).emit(EmitTypes.UPDATEMESSAGE, responseData);
    return { ok: true, data: responseData };
  }

  private isAllowed(client: Socket, message: { is_answer: number; operator_id: number; user: { chat_id: string } }) {
    const actor = client['user'];
    if (actor?.user_id) return message.is_answer === 1 && message.operator_id === actor.user_id;
    return message.is_answer === 0 && Boolean(actor?.uuid) && message.user.chat_id === actor.uuid;
  }

  private emitError(server: Server, socketId: string, message: string) {
    const payload = { status: 403, error: 'Bad Request', message };
    server.to(socketId).emit(EmitTypes.EXCEOPTION, payload);
    return { ok: false, error: payload };
  }
}
