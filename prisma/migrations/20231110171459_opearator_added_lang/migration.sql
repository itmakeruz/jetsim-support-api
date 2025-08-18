-- AlterTable
ALTER TABLE "operators" ADD COLUMN     "lang" TEXT DEFAULT 'uz';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;
