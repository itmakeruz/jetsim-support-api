import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsNumberString, IsOptional, IsString, MinLength, isNumberString } from 'class-validator';

export class UserQueryDto {
  @ApiProperty({ type: String, default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  page: string;

  @ApiProperty({ type: String, default: '50', required: false })
  @IsOptional()
  @IsNumberString()
  size: string;

  @IsOptional()
  @ApiProperty({ type: String, default: '50' })
  @IsString()
  search?: string;
}

export class WordsHintsDto {
  @IsOptional()
  @ApiProperty({ type: String, default: 'Assalomu alekum ' })
  @IsString()
  search?: string;
}

export class UserParamDto {
  @IsOptional()
  @ApiProperty({ type: String, default: '1,3,4,5', required: false })
  @MinLength(1)
  @IsString()
  ids?: string;

  @IsOptional()
  @ApiProperty({
    type: String,
    default: 'active,answer,awaiting',
    required: false,
  })
  @MinLength(3)
  @IsString()
  statuses?: string;

  @IsOptional()
  @ApiProperty({ type: String, default: '1', required: false })
  @IsNumberString()
  page?: string;

  @IsOptional()
  @ApiProperty({ type: String, default: '10', required: false })
  @IsNumberString()
  size?: string;

  @IsOptional()
  @ApiProperty({ type: String, default: '1,3,4,5', required: false })
  @MinLength(1)
  @IsString()
  subject_ids?: string;

  @IsOptional()
  @ApiProperty({ type: String, default: 'Kredit', required: false })
  @MinLength(1)
  @IsString()
  search?: string;

  @IsOptional()
  @ApiProperty({ type: String, default: '7', required: false })
  @IsIn(['7', '10', '14', '28'])
  @IsNumberString()
  day?: string;
}

export class UserCardsDto {
  @ApiProperty({ type: String, default: '2' })
  @IsNumberString()
  user_id: string;
}

export class UserCardsTranDto {
  @ApiProperty({ type: String, default: '1,2,3' })
  @IsNumberString()
  @IsOptional()
  card_ids: string;

  @IsOptional()
  @ApiProperty({ type: String, default: '1', required: false })
  @IsNumberString()
  page?: string;

  @IsOptional()
  @ApiProperty({ type: String, default: '20', required: false })
  @IsNumberString()
  size?: string;
}
