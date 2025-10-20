import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { StatusType } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({
    example: { ru: 'Транспорт', en: 'Transport' },
    description: 'Kategoriya nomi (ikkita tilda)',
  })
  @IsObject()
  @IsNotEmpty()
  name: { ru: string; en: string };

  @ApiProperty({
    example: '#FF5733',
    required: false,
    description: 'Kategoriya rangi (ixtiyoriy)',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    enum: StatusType,
    required: false,
    example: StatusType.ACTIVE,
    description: 'Kategoriya holati (ixtiyoriy)',
  })
  @IsOptional()
  @IsEnum(StatusType)
  status?: StatusType;
}
