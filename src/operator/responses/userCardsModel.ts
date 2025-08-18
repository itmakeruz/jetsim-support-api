import { ApiProperty } from "@nestjs/swagger";

export class UserCardsResponse {
    @ApiProperty({type: Number})
    id: number

    @ApiProperty({type: String})
    pan: string

    @ApiProperty({type: String})
    expire: string

    @ApiProperty({type: String})
    holder: string

    @ApiProperty({type: String})
    bank_name: string

    @ApiProperty({type: String})
    phone_number: string

    @ApiProperty({type: String})
    icon: string

    @ApiProperty({type: String})
    status: string
}