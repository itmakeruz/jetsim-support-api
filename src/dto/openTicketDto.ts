import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsNumber, IsNumberString, IsOptional, IsString } from 'class-validator';
import { ContentType } from './types';

export class openTicketDto {
  @IsNumber()
  @ApiProperty({ type: Number })
  category_id: number;

  @IsString()
  @ApiProperty({ type: String })
  message: string;

  bot_message_id?: number;

  content_type?: ContentType;
}

export class SendFileDto {
  @IsOptional()
  @IsNumber()
  reply_message_id?: number;

  @IsNumberString()
  ticket_id: string;
}

export class FileUploadDto {
  @IsNumberString()
  @ApiProperty({ type: String, default: '10', required: false, nullable: true })
  reply_message_id: string;

  @IsNumberString()
  @ApiProperty({ type: String, default: '10', required: true })
  ticket_id: string;

  @ApiProperty({ type: String, format: 'binary' })
  file: {
    type: 'string';
    format: 'binary';
  };
}

class reply_content {
  @ApiProperty({ type: String })
  content: string;

  @ApiProperty({ type: String, nullable: true, required: false })
  content_type: string | undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  author: string | undefined;
}

export class Message {
  @ApiProperty({ type: String })
  content: string;

  @ApiProperty({ type: Number, nullable: true, required: false })
  reply_message_id?: number | undefined;

  @ApiProperty({ type: Number, nullable: true, required: false })
  reply_bot_message_id?: number | undefined;

  @ApiProperty({ type: reply_content, nullable: true, required: false })
  reply_content?: reply_content | undefined;
}

export class closeTicketDto {
  @IsNumber()
  @ApiProperty({ type: Number })
  ticket_id: number;

  @IsNumber()
  @ApiProperty({ type: Number })
  rate: number;
}
