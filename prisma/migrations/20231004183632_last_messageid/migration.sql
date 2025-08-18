/*
  Warnings:

  - You are about to drop the column `last_message` on the `tickets` table. All the data in the column will be lost.
  - Added the required column `last_message_id` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "last_message",
ADD COLUMN     "last_message_id" INTEGER NOT NULL;
