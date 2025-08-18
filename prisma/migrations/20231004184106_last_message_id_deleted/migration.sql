/*
  Warnings:

  - You are about to drop the column `last_message_id` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "last_message_id";
