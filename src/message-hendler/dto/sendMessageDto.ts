import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { ContentType } from 'src/dto/types';

export class sendMessageDto {
  @IsNumber()
  @ApiProperty({ type: Number, required: false })
  reply_message_id?: number;

  @IsString()
  @ApiProperty({ type: String })
  message: string;

  @IsNumber()
  @ApiProperty({ type: Number })
  ticket_id: number;

  content_type?: ContentType;
}

export class editMessageDto {
  @IsNumber()
  @ApiProperty({ type: Number, required: false })
  message_id?: number;

  @IsString()
  @ApiProperty({ type: String })
  message: string;
}

export class deleteMessageDto {
  @IsNumber()
  @ApiProperty({ type: Number, required: false })
  message_id?: number;

  @IsString()
  @ApiProperty({ type: String })
  message: string;
}
