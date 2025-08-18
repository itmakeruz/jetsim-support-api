/*
  Warnings:

  - A unique constraint covering the columns `[chat_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "socket_id" TEXT,
ALTER COLUMN "chat_id" DROP NOT NULL,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "last_message" DROP NOT NULL,
ALTER COLUMN "phone_number" DROP NOT NULL,
ALTER COLUMN "photo" DROP NOT NULL,
ALTER COLUMN "lang" DROP NOT NULL,
ALTER COLUMN "is_online" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_chat_id_key" ON "users"("chat_id");
