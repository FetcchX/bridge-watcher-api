-- CreateEnum
CREATE TYPE "Chain" AS ENUM ('POL', 'ETH', 'AVAX', 'BSC');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "from_chain" "Chain" NOT NULL DEFAULT E'ETH',
ADD COLUMN     "to_chain" "Chain" NOT NULL DEFAULT E'POL';
