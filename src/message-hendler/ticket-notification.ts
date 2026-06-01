import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContentType, EmitTypes } from 'src/dto/types';
import { TicketModel } from 'src/operator/responses';
import { Helper } from 'src/helper/helper';

@Injectable()
export class TicketHelper {
  constructor(private prisma: PrismaService) {}
  async notification(server?: Server, ticket_id?: number, req_lang?: string) {
    let operators = await this.prisma.operators.findMany({
      where: { is_active: true },
      select: { config: true, lang: true },
    });
    for (const operator of operators) {
      let tickets = await this.prisma.tickets.findMany({
        where: {
          AND: Object(operator?.config?.filters),
        },
        select: {
          id: true,
          categories: true,
          user: {
            select: { id: true, name: true, is_online: true },
          },
          messages: {
            orderBy: { created_at: 'desc' },
          },
          updated_at: true,
          status: true,
          request_close: true,
          operator: true,
          last_request_user: true,
        },
      });
      for (const ticket of tickets) {
        if (ticket.id == ticket_id) {
          let response: TicketModel = {
            id: ticket.id,
            subject: ticket.categories.name[operator.lang],
            user_name: ticket.user.name,
            color: ticket.categories.color,
            last_message:
              ticket.messages[0].content_type != ContentType.TEXT
                ? { content: ticket.messages[0].content_type, message_id: ticket.messages[0].id }
                : { content: Object(ticket.messages[0]?.message)?.content || '', message_id: ticket.messages[0].id },
            user_id: ticket.user.id,
            last_request_user:
              ticket.messages[0].is_answer === 0 ? ticket.user.name : ticket?.operator?.first_name || '',
            push: ticket.messages.filter((msg) => msg.is_answer === 0 && msg.is_ready === false).length,
            formatted_date: Helper.formatByMonthName(ticket.messages[0]?.created_at ?? ticket.updated_at, operator.lang),
            status: ticket.status,
            request_close: ticket.request_close,
            is_online: ticket.user.is_online,
            ticket_id: ticket_id,
          };
          server.to(ticket?.operator?.socket_id).emit(EmitTypes.UPDATETICKET, response);
        }
      }
    }
  }
}
