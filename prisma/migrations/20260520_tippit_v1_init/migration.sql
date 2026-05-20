-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TippitRail" AS ENUM ('magicblock', 'umbra');

-- CreateEnum
CREATE TYPE "TipVisibility" AS ENUM ('public', 'creator_only', 'anonymous');

-- CreateEnum
CREATE TYPE "TipStatus" AS ENUM ('created', 'signed', 'confirmed', 'failed');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('created', 'confirmed', 'failed');

-- CreateTable
CREATE TABLE "CreatorProfile" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultRail" "TippitRail" NOT NULL DEFAULT 'magicblock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorSlug" TEXT NOT NULL,
    "fanWalletAddress" TEXT,
    "amountBaseUnits" TEXT NOT NULL,
    "amountUi" DECIMAL(20,6) NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "message" TEXT,
    "visibility" "TipVisibility" NOT NULL DEFAULT 'creator_only',
    "paymentRail" "TippitRail" NOT NULL DEFAULT 'magicblock',
    "paymentStatus" "TipStatus" NOT NULL DEFAULT 'created',
    "txSignature" TEXT,
    "clientRefId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amountBaseUnits" TEXT NOT NULL,
    "amountUi" DECIMAL(20,6) NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "paymentRail" "TippitRail" NOT NULL DEFAULT 'magicblock',
    "txSignature" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'created',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_walletAddress_key" ON "CreatorProfile"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_slug_key" ON "CreatorProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tip_clientRefId_key" ON "Tip"("clientRefId");

-- CreateIndex
CREATE INDEX "Tip_creatorId_createdAt_idx" ON "Tip"("creatorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Tip_creatorSlug_createdAt_idx" ON "Tip"("creatorSlug", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Withdrawal_creatorId_createdAt_idx" ON "Withdrawal"("creatorId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

