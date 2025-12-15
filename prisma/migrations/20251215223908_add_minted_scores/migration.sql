/*
  Warnings:

  - You are about to drop the column `walletAddress` on the `Run` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Run` table without a default value. This is not possible if the table is not empty.
  - Added the required column `critUpgrades` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currCoins` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fid` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ltimeCoins` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valueUpgrades` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Run" DROP COLUMN "walletAddress",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "critUpgrades" INTEGER NOT NULL,
ADD COLUMN     "currCoins" INTEGER NOT NULL,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "fid" INTEGER NOT NULL,
ADD COLUMN     "ltimeCoins" INTEGER NOT NULL,
ADD COLUMN     "pfpUrl" TEXT,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "valueUpgrades" INTEGER NOT NULL,
ALTER COLUMN "walletAddress" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MintedScore" (
    "id" SERIAL NOT NULL,
    "score" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "mintedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MintedScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MintedScore_score_key" ON "MintedScore"("score");

-- CreateIndex
CREATE UNIQUE INDEX "User_fid_key" ON "User"("fid");

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MintedScore" ADD CONSTRAINT "MintedScore_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
