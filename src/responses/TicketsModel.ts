import { ApiProperty } from '@nestjs/swagger';

export class MyTicketModel {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  categoty_name: string;

  @ApiProperty({ type: String })
  formatted_date: string;

  @ApiProperty({ type: String })
  last_message: string;

  @ApiProperty({ type: Boolean })
  request_close: boolean;

  @ApiProperty({ type: String })
  status: string;

  @ApiProperty({ type: String })
  color: string;
}
