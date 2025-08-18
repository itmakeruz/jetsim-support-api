import { ApiProperty } from "@nestjs/swagger";

export class GetMeResponse {
    @ApiProperty({type: Number})
    id: number

    @ApiProperty({type: String})
    name: string

    @ApiProperty({type: String})
    photo: string

    @ApiProperty({type: String})
    login: string    
}