import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { UserModel } from './usersModel';
import { TicketModel } from './ticketModel';
import { SendMessageResponse } from 'src/message-hendler/emitsmodel/sendmessage-response';

export class ChatModel {
  @ApiProperty({ type: UserModel })
  user: UserModel;

  @ApiProperty({ type: TicketModel })
  ticket: TicketModel;

  @ApiProperty({ type: SendMessageResponse, isArray: true })
  messages: Array<SendMessageResponse>;
}

export class HintsResponse {
  @ApiProperty({ type: String })
  message: string;
}
