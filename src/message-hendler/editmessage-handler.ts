import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { editMessageDto } from './dto/sendMessageDto';
import { OperatorRequest } from 'src/dto/operatorModel';
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
    let lang = client.handshake?.headers?.lang?.toString() || 'ru';
    const { message, message_id } = data;

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

    Object(findMessage.message).content = message;

    if (findMessage.bot_id) {
      let response = await botSendMesssage('editMessageText', {
        chat_id: findMessage.user.chat_id,
        message_id: Number(findMessage.bot_id),
        text: message,
      });
      if (response?.['ok'] === false) {
        Object(findMessage.message).content = user_blocked[lang] + '\n\n' + message;
        await this.prisma.messages.update({
          where: { id: findMessage.id },
          data: { message: findMessage.message },
        });
      } else {
        await this.prisma.messages.update({
          where: { id: findMessage.id },
          data: { message: findMessage.message },
        });
      }
    } else {
      await this.prisma.messages.update({
        where: { id: findMessage.id },
        data: { message: findMessage.message },
      });
    }

    let responseData: SendMessageResponse = {
      id: findMessage.id,
      message: Object(findMessage.message),
      formatted_time: Helper.formatMessageTime(findMessage.created_at),
      date: findMessage.created_at,
      base_url: this.config.get('FILES_BASE_URL'),
      is_answer: findMessage.is_answer,
      author: findMessage.is_answer ? findMessage.operator.first_name : findMessage.user.name,
      content_type: findMessage.content_type,
      is_ready: true,
    };

    await server.to(client.id).emit(EmitTypes.UPDATEMESSAGE, responseData);
  }
}
