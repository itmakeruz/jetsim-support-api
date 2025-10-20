import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class loginDto {
  @IsString()
  @ApiProperty({ type: String })
  login: string;

  @IsString()
  @ApiProperty({ type: String })
  password: string;
}

export class RegisterDto {
  @IsString()
  @ApiProperty({ type: String })
  login: string;

  @IsString()
  @ApiProperty({ type: String })
  password: string;
}

export class UpdateUserDto {
  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  login: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  password: string;
}
