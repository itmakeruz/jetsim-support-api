import { ApiProperty } from "@nestjs/swagger";

export class Transactions {
    @ApiProperty({type: String})
    name: string

    @ApiProperty({type: String})
    summa: string
    
    @ApiProperty({type: String})
    status: string
    
    @ApiProperty({type: String})
    status_color: string

    @ApiProperty({type: String})
    formatted_date: string

    @ApiProperty({type: String})
    icon: string
}

export class TransactionsResponse {
    @ApiProperty({type: Number})
    totalPage: number

    @ApiProperty({type: Number})
    totalElements: number
    
    @ApiProperty({type: Number, nullable: true})
    nextPage: number | null

    @ApiProperty({type: Number, nullable: true})
    prevPage: number | null
    
    @ApiProperty({type: Transactions, isArray: true})
    transactions: Transactions[]
}