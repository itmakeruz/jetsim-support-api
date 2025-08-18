import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { log } from 'console';
import { CronJob } from 'cron';
import { Server, Socket } from 'socket.io';
import { ContentType, EmitTypes } from 'src/dto/types';
import { SendMessageResponse } from './emitsmodel/sendmessage-response';
import { PrismaService } from 'src/prisma/prisma.service';
import { Message } from 'src/dto/openTicketDto';
import { ConfigService } from '@nestjs/config';
import { Users } from '@prisma/client';
import { createChat } from './opanai';
import { defaultMessages } from 'src/dictonary';

interface SocketInterface {
  date: string
  client: Socket
  server: Server
  userData: Users
  ticket_id: number
  timestamp: number
}


@Injectable()
export class TasksService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {

  }
  onModuleInit() {
    this.addCron()
  }


  private cronJobs: Map<string, SocketInterface> = new Map();

  addCron() {
    let job = new CronJob(`* * * * * *`, async () => {
      for (const element of Array.from(this.cronJobs.keys())) {
        let job = this.cronJobs.get(element)
        if (Date.now() - Number(job.date) > (job?.timestamp ?? 30000)) {
          this.sendMessage(
            job.client,
            job.server,
            job.userData,
            job.ticket_id,
          )
          this.deleteCronJob(element)
        }
      }
    })
    job.start()
  }

  createCronJob(server: Server, client: Socket, userData: Users, ticket_id: number, lang:string = 'uz', timestamp?:number) {
    this.cronJobs.set(userData.chat_id, {
      date: Date.now().toString(),
      server: server,
      client: client,
      userData: userData,
      ticket_id,
      timestamp,
    })
  }

  deleteCronJob(name: string) {
    this.cronJobs.delete(name)
  }

  async sendMessage(client: Socket, server: Server, userData: Users, ticket_id: number, lang:string = 'uz') {
    let ticket = await this.prisma.tickets.findUnique({ where: { id: ticket_id }})

    let defaultMessage = defaultMessages[ticket.category_id][ticket.lang]
    let sendmessage: Message = {
      content: defaultMessage,
    }

    let createdMessage = await this.prisma.messages.create({
      data: {
        user_id: userData.id,
        is_answer: 1,
        content_type: ContentType.TEXT,
        ticket_id: ticket_id,
        message: sendmessage as any,
        operator_id: 1,
        is_ready: true
      },
      select: {
        id: true,
        message: true,
        content_type: true,
        created_at: true,
        is_answer: true,
        user: {
          select: {
            id: true,
            chat_id: true,
            name: true,
            phone_number: true,
            is_block: true,
            is_online: true,
            messages: true,
            updated_at: true
          }
        },
        operator: {
          select: {
            first_name: true
          }
        },
        is_ready: true,
      }
    })

    let responseData: SendMessageResponse = {
      id: createdMessage.id,
      message: sendmessage,
      formatted_time: createdMessage.created_at.toLocaleTimeString('ru'),
      date: createdMessage.created_at,
      base_url: this.config.get('FILES_BASE_URL'),
      is_answer: createdMessage.is_answer,
      author: createdMessage.operator.first_name,
      content_type: createdMessage.content_type,
      is_ready: createdMessage.is_ready
    }
    server.to(client.id).emit(EmitTypes.NEWMESSAGE, responseData)
  }
}