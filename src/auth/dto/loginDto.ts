import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class loginDto {
    @IsString()
    @ApiProperty({type: String})
    login:string

    @IsString()
    @ApiProperty({type: String})
    password:string
}

export class RegisterDto {
    @IsString()
    @ApiProperty({type: String})
    login:string

    @IsString()
    @ApiProperty({type: String})
    password:string
}