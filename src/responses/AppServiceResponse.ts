import { ApiProperty } from '@nestjs/swagger';
import { MyTicketModel } from './TicketsModel';

export class GetTicektsResponse {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;
}

export class OpenTicketResponse {
  @ApiProperty({ type: String, default: 'success' })
  result: string;

  @ApiProperty({ type: GetTicektsResponse })
  data: GetTicektsResponse;
}

export class BadRequestExceptionResponse {
  @ApiProperty({ type: String, default: 'Bad Request' })
  error: string;

  @ApiProperty({ type: String })
  message: string;

  @ApiProperty({ type: Number, default: 400 })
  statusCode: number;
}

export class MyticketResponse {
  @ApiProperty({ type: Boolean })
  isDisabled: boolean;

  @ApiProperty({ type: MyTicketModel, isArray: true })
  tickets: MyTicketModel[];
}

export class closeTicketResponse {
  @ApiProperty({ type: Boolean })
  result: boolean;

  @ApiProperty({ type: String })
  message: string;
}
