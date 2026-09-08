import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Message } from 'src/dto/openTicketDto';

export class SendMessageResponse {
  @ApiProperty({ type: Number })
  ticket_id: number;

  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Message })
  message: Message;

  @ApiProperty({ type: String })
  formatted_time: string;

  @ApiProperty({ type: Date })
  date: Date;

  @ApiProperty({ type: String })
  base_url: string;

  @ApiProperty({ type: Number })
  is_answer: number;

  @ApiProperty({ type: String })
  author: string;

  @ApiProperty({ type: String })
  content_type: string;

  @ApiProperty({ type: Boolean })
  is_ready: boolean;
}
