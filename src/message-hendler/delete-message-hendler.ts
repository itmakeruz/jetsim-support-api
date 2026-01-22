import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { deleteMessageDto, editMessageDto } from './dto/sendMessageDto';
import { OperatorRequest } from 'src/dto/operatorModel';
import { PrismaService } from 'src/prisma/prisma.service';
import { botSendMesssage } from 'src/telegram-bot/hendlers/botsender';
import { _user_blocked, user_blocked } from 'src/dictonary';
import { EmitTypes } from 'src/dto/types';
import { SendMessageResponse } from './emitsmodel/sendmessage-response';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeleteMessage {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}
  async deleteMessage(data: deleteMessageDto, client: Socket, server: Server) {
    const { message_id } = data;

    let findMessage = await this.prisma.messages.findUnique({
      where: { id: message_id },
      select: {
        id: true,
        message: true,
        user: true,
        bot_id: true,
        ticket_id: true,
        created_at: true,
        is_answer: true,
        operator: true,
        content_type: true,
      },
    });

    if (findMessage.bot_id) {
      let response = await botSendMesssage('deleteMessage', {
        chat_id: findMessage.user.chat_id,
        message_id: Number(findMessage.bot_id),
      });
      if (response?.['ok'] === false) {
        await this.prisma.messages.update({
          where: { id: findMessage.id },
          data: {
            deleted: true,
          },
        });
      } else {
        await this.prisma.messages.update({
          where: { id: findMessage.id },
          data: {
            deleted: true,
          },
        });
      }
    } else {
      await this.prisma.messages.update({
        where: { id: findMessage.id },
        data: {
          message: findMessage.message,
        },
      });
    }

    let responseData: SendMessageResponse = {
      id: findMessage.id,
      message: Object(findMessage.message),
      formatted_time: new Date(findMessage.created_at.getTime() + 5 * 60 * 60 * 1000).toLocaleTimeString(),
      date: findMessage.created_at,
      base_url: this.config.get('FILES_BASE_URL'),
      is_answer: findMessage.is_answer,
      author: findMessage.is_answer ? findMessage.operator.first_name : findMessage.user.name,
      content_type: findMessage.content_type,
      is_ready: true,
    };

    await server.to(client.id).emit(EmitTypes.REMOVEMESSAGE, responseData);
  }
}
