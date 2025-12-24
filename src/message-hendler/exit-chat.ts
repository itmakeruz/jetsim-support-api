import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { deleteMessageDto, editMessageDto, exitChatDto } from './dto/sendMessageDto';
import { OperatorRequest } from 'src/dto/operatorModel';
import { PrismaService } from 'src/prisma/prisma.service';
import { botSendMesssage } from 'src/telegram-bot/hendlers/botsender';
import { _user_blocked, user_blocked } from 'src/dictonary';
import { EmitTypes } from 'src/dto/types';
import { SendMessageResponse } from './emitsmodel/sendmessage-response';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExitChat {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}
  async exitChat(data: exitChatDto, client: Socket, server: Server) {
    const { ticket_id } = data;
    let user: OperatorRequest = client['user'];

    await this.prisma.operators.update({
      where: {
        id: user.user_id,
        ticket_id: ticket_id,
      },
      data: {
        ticket_id: null,
        user_id: null,
      },
    });

    server.to(client.id).emit(EmitTypes.EXITCHAT, { success: true });
  }
}
