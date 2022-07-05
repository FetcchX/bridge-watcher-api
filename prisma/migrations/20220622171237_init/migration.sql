-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'FAILED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Bridge" AS ENUM ('HOP', 'CELER', 'HYPHEN', 'ACROSS');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "origin_tx_hash" TEXT NOT NULL,
    "dest_tx_hash" TEXT,
    "bridge" "Bridge" NOT NULL,
    "status" "TxStatus" NOT NULL,
    "origin_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dest_time" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
