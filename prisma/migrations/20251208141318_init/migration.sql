-- CreateTable
CREATE TABLE "Run" (
    "id" SERIAL NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);
