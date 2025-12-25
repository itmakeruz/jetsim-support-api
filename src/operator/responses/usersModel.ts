import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Message } from 'src/dto/openTicketDto';

export class UserModel {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  chat_id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  date: string;

  @ApiProperty({ type: Message })
  last_message: Message | Prisma.JsonValue;

  @ApiProperty({ type: String })
  phone: string;

  @ApiProperty({ type: Boolean })
  is_block: boolean;

  @ApiProperty({ type: Boolean })
  is_online: boolean;

  @ApiProperty({ type: Number })
  push: number;

  @ApiProperty({ type: Number })
  ticket_id?: number;

  @ApiProperty({ type: Number })
  user_image?: string;
}

export class UsersResponse {
  @ApiProperty({ type: Number })
  totalPage: number;

  @ApiProperty({ type: Number })
  totalUsers: number;

  @ApiProperty({ type: Number })
  nextPage: number | null;

  @ApiProperty({ type: Number })
  prevPage: number | null;

  @ApiProperty({ type: UserModel, isArray: true })
  users: Array<UserModel>;

  @ApiProperty({ type: UserModel, isArray: true })
  selected_users: Array<UserModel>;
}
