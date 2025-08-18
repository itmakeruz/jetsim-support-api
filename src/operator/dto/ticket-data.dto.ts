import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsNumberString, IsOptional } from "class-validator";

export class TicketIdDto {
    @ApiProperty({type: String, default: '1'})
    @IsNumberString()
    id:string
}

export class FilterType { 
    user_id?: {in: Array<number>}
    status?: {in: Array<string>}
    deleted?: boolean
    operator_id?: number
    category_id?: {in: Array<number>}
    updated_at?: {
        lte: Date
        gte: Date
    }
}