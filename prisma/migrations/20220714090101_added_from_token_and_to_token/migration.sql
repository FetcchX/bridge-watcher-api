-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "from_token" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "to_token" TEXT NOT NULL DEFAULT E'';
