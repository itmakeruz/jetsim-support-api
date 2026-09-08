import {
  SubscribeMessage,
  ConnectedSocket,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards, UsePipes } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { OperatorMessageHendler } from './message-hendler/operator-message-handler';
import { MyWebSocketGuard } from './auth/socket.guard';
import { ClientMessageHendler } from './message-hendler/client-message-handler';
import { deleteMessageDto, editMessageDto, exitChatDto, sendMessageDto } from './message-hendler/dto/sendMessageDto';
import { ZodValidationPipe } from './message-hendler/socket-validator-pipe/validator-service';
import { DeleteMessageData, EditMessageData, ExitChatData, SendMessageData } from './message-hendler/socket-validator-pipe/schema';
import { EmitTypes } from './dto/types';
import { EditMessage } from './message-hendler/editmessage-handler';
import { DeleteMessage } from './message-hendler/delete-message-hendler';
import { ExitChat } from './message-hendler/exit-chat';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
@UseGuards(MyWebSocketGuard)
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private operatorService: OperatorMessageHendler,
    private clientService: ClientMessageHendler,
    private editmessage: EditMessage,
    private deletemessage: DeleteMessage,
    private readonly exitchat: ExitChat,
  ) {}

  @WebSocketServer() server: Server;

  async handleConnection(data: Socket) {
    try {
      let client = await this.jwtVerify(data);

      if (client?.user?.user_id) {
        await client.join(`operator:${client.user.user_id}`);
        await this.prisma.operators.update({
          where: {
            id: client.user.user_id,
          },
          data: {
            is_active: true,
            socket_id: client.id,
          },
        });
      } else if (client?.user?.uuid) {
        const user = await this.prisma.users.update({
          where: {
            chat_id: client.user.uuid,
          },
          data: { is_online: true, socket_id: client.id },
        });
        await client.join(`user:${user.id}`);
      }
    } catch (error) {}
  }

  async handleDisconnect(data: Socket) {
    try {
      let client = await this.jwtVerify(data);
      if (client?.user?.user_id) {
        const sockets = await this.server.in(`operator:${client.user.user_id}`).fetchSockets();
        const hasAnotherConnection = sockets.some((socket) => socket.id !== data.id);
        if (hasAnotherConnection) return;
        await this.prisma.operators.update({
          where: { id: client.user.user_id },
          data: { is_active: false },
        });
      } else if (client?.user?.uuid) {
        const user = await this.prisma.users.findUnique({ where: { chat_id: client.user.uuid }, select: { id: true } });
        if (!user) return;
        const sockets = await this.server.in(`user:${user.id}`).fetchSockets();
        const hasAnotherConnection = sockets.some((socket) => socket.id !== data.id);
        if (hasAnotherConnection) return;
        await this.prisma.users.update({
          where: { chat_id: client.user.uuid },
          data: { is_online: false },
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  @UsePipes(new ZodValidationPipe(SendMessageData))
  @SubscribeMessage(EmitTypes.SENDMESSAGE)
  async sendMessage(@MessageBody() body: sendMessageDto, @ConnectedSocket() client: Socket) {
    return await this.operatorService.sendMessage(body, client, this.server);
  }

  @UsePipes(new ZodValidationPipe(SendMessageData))
  @SubscribeMessage(EmitTypes.APPNEWMESSAGE)
  async appSendMessage(@MessageBody() body: sendMessageDto, @ConnectedSocket() client: Socket) {
    return await this.clientService.sendMessage(body, client, this.server);
  }

  @UsePipes(new ZodValidationPipe(EditMessageData))
  @SubscribeMessage(EmitTypes.EDITMESSAGE)
  async editMessage(@MessageBody() body: editMessageDto, @ConnectedSocket() client: Socket) {
    return await this.editmessage.editMessage(body, client, this.server);
  }

  @UsePipes(new ZodValidationPipe(DeleteMessageData))
  @SubscribeMessage(EmitTypes.DELETEMESSAGE)
  async deleteMessage(@MessageBody() body: deleteMessageDto, @ConnectedSocket() client: Socket) {
    return await this.deletemessage.deleteMessage(body, client, this.server);
  }

  @UsePipes(new ZodValidationPipe(ExitChatData))
  @SubscribeMessage(EmitTypes.EXITCHAT)
  async exitChat(@MessageBody() body: exitChatDto, @ConnectedSocket() client: Socket) {
    return await this.exitchat.exitChat(body, client, this.server);
  }

  private async jwtVerify(client) {
    try {
      const token = client.handshake.headers.token || client.handshake.auth?.token;
      client.user = await this.jwt.verify(token);
      return client;
    } catch (error) {
      this.server.to(client.id).emit('exception', { status: 401, message: 'Unauthorized' });
      return false;
    }
  }
}
