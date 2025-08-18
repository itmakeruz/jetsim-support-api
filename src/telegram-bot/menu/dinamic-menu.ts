import { Injectable } from "@nestjs/common";
import { Users } from "@prisma/client";
import TelegramBot from "node-telegram-bot-api";
import { AppService } from "src/app.service";
import { StatusTypes } from "src/dto/types";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class DinamicButton {
    constructor(
        private prisma: PrismaService,
        private clientService: AppService
    ) {}

    public async ticket_buttons(user:Users) {
        let tickets = await this.clientService.getTicketsList({phone: user.phone_number, uuid: user.chat_id}, user.lang, true)
        let array:TelegramBot.InlineKeyboardMarkup = {
            inline_keyboard: []
        }
        let userTicket = await this.prisma.tickets.findMany({
            where: {
                AND: {
                    user_id: user.id, 
                    status: {notIn: [StatusTypes.CLOSED]}
                }
            },
            select: {id: true, categories: true}
        })
        tickets.map(ticket => ticket.name = "🔹 " +ticket.name)

        let userCategories = userTicket.map(ticket => {
            return {
                id: '_'+ticket.id,
                name: "🔸 "+ticket.categories.name[user.lang]
            }
        })
        let usertickets = []
        usertickets.unshift(...userCategories,...tickets)
        usertickets.forEach(ticket => {
            array.inline_keyboard.push([{text: ticket.name, callback_data: ticket.id}])
        })
    
        return array
    }
}
