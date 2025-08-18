import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, MinDate } from 'class-validator';

export class ReportQueriesDto {
  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  @ApiProperty({ type: Date })
  fromDate?: Date;

  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  @ApiProperty({ type: Date })
  toDate?: Date;
}
