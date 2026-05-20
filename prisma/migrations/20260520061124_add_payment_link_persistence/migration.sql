-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('draft', 'active', 'paid', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('created', 'awaiting_signature', 'submitted', 'confirmed', 'claimable', 'claimed', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "PrivacyMode" AS ENUM ('umbra_utxo', 'public_transfer');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('one_time', 'reusable');

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'devnet',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLink" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "receiverWallet" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'USDC',
    "tokenMint" TEXT,
    "tokenSymbol" TEXT NOT NULL DEFAULT 'USDC',
    "network" TEXT NOT NULL DEFAULT 'devnet',
    "linkType" "LinkType" NOT NULL DEFAULT 'one_time',
    "privacyMode" "PrivacyMode" NOT NULL DEFAULT 'umbra_utxo',
    "status" "LinkStatus" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "paymentLinkId" TEXT NOT NULL,
    "linkTitle" TEXT NOT NULL,
    "receiverWallet" TEXT NOT NULL,
    "payerWallet" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'USDC',
    "tokenMint" TEXT,
    "tokenSymbol" TEXT NOT NULL DEFAULT 'USDC',
    "network" TEXT NOT NULL DEFAULT 'devnet',
    "status" "PaymentStatus" NOT NULL DEFAULT 'awaiting_signature',
    "solanaSignature" TEXT,
    "claimSignature" TEXT,
    "umbraUtxoCommitment" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "receiptCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "intentStatus" "PaymentStatus" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'devnet',
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_walletAddress_network_key" ON "Merchant"("walletAddress", "network");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentLink_slug_key" ON "PaymentLink"("slug");

-- CreateIndex
CREATE INDEX "PaymentLink_receiverWallet_network_idx" ON "PaymentLink"("receiverWallet", "network");

-- CreateIndex
CREATE INDEX "PaymentIntent_receiverWallet_network_idx" ON "PaymentIntent"("receiverWallet", "network");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_paymentIntentId_key" ON "Receipt"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptCode_key" ON "Receipt"("receiptCode");

-- CreateIndex
CREATE INDEX "PaymentEvent_paymentIntentId_idx" ON "PaymentEvent"("paymentIntentId");

-- AddForeignKey
ALTER TABLE "PaymentLink" ADD CONSTRAINT "PaymentLink_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_paymentLinkId_fkey" FOREIGN KEY ("paymentLinkId") REFERENCES "PaymentLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
