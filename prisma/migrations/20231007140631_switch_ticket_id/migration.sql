-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "last_message_id" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "switch_ticket_id" INTEGER;
