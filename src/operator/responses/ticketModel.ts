import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class LastMessage {
  @ApiProperty({ type: String })
  content: string;

  @ApiProperty({ type: Number })
  message_id: number;
}

export class TicketModel {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  user_id: number;

  @ApiProperty({ type: String })
  subject: string;

  @ApiProperty({ type: String })
  user_name: string;

  @ApiProperty({ type: String })
  color: string;

  @ApiProperty({ type: LastMessage })
  last_message: LastMessage;

  @ApiProperty({ type: String })
  formatted_date: string;

  @ApiProperty({ type: String })
  last_request_user: string;

  @ApiProperty({ type: Number })
  push: number;

  @ApiProperty({ type: String })
  status: string;

  @ApiProperty({ type: Boolean })
  request_close: boolean;

  @ApiProperty({ type: Boolean })
  is_online: boolean;

  @ApiProperty({ type: Number })
  ticket_id?: number;

  @ApiProperty({ type: String })
  user_image?: string;

  @ApiProperty({ type: String })
  base_url: string;
}

export class CloseTicketResponse {
  @ApiProperty({ type: Boolean })
  result: boolean;

  @ApiProperty({ type: String })
  message: string;
}

export class TicketResponseModel {
  @ApiProperty({ type: Number })
  totalPage: number;

  @ApiProperty({ type: Number })
  totalElements: number;

  @ApiProperty({ type: Number })
  nextPage: number | null;

  @ApiProperty({ type: Number })
  prevPage: number | null;

  tickets: TicketModel[];
}

class categories {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  order: number;
}

class statuses {
  @ApiProperty({ type: String })
  slug: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  order: number;
}

class dates {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  order: number;
}

export class FilterDataModel {
  @ApiProperty({ type: categories, isArray: true })
  categories: categories[];

  @ApiProperty({ type: statuses, isArray: true })
  statuses: statuses[];

  @ApiProperty({ type: dates, isArray: true })
  dates: dates[];
}
