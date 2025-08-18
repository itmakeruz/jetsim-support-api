import { Module } from '@nestjs/common';
import { ClientMessageHendler } from './client-message-handler';
import { OperatorMessageHendler } from './operator-message-handler';
import { TicketHelper } from './ticket-notification';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './auto-answer';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [ClientMessageHendler, OperatorMessageHendler, TicketHelper, TasksService],
})
export class MessageHendlerModule {}
