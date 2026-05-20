import { Prisma, TipStatus, TippitRail, TipVisibility, WithdrawalStatus } from "@prisma/client";
import type { AppNetwork } from "@/lib/network";
import { getPrismaClient } from "@/lib/db/prisma";
import type { CreatorDashboardPayload, CreatorProfileRecord, TipRecord, WithdrawalRecord, TipVisibility as TipVisibilityType } from "@/lib/tippit/types";

function toNumber(value: Prisma.Decimal | number | string) {
  return typeof value === "number" ? value : Number(value);
}

function mapCreator(record: {
  id: string;
  walletAddress: string;
  slug: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  defaultRail: TippitRail;
  createdAt: Date;
  updatedAt: Date;
}): CreatorProfileRecord {
  return {
    id: record.id,
    walletAddress: record.walletAddress,
    slug: record.slug,
    displayName: record.displayName,
    bio: record.bio ?? undefined,
    avatarUrl: record.avatarUrl ?? undefined,
    bannerUrl: record.bannerUrl ?? undefined,
    isVerified: record.isVerified,
    isActive: record.isActive,
    defaultRail: record.defaultRail,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapTip(record: {
  id: string;
  creatorId: string;
  creatorSlug: string;
  fanWalletAddress: string | null;
  amountBaseUnits: string;
  amountUi: Prisma.Decimal;
  tokenMint: string;
  tokenSymbol: string;
  message: string | null;
  visibility: TipVisibility;
  paymentRail: TippitRail;
  paymentStatus: TipStatus;
  txSignature: string | null;
  clientRefId: string;
  createdAt: Date;
  confirmedAt: Date | null;
}): TipRecord {
  return {
    id: record.id,
    creatorId: record.creatorId,
    creatorSlug: record.creatorSlug,
    fanWalletAddress: record.fanWalletAddress ?? undefined,
    amount: record.amountBaseUnits,
    amountUi: toNumber(record.amountUi),
    tokenMint: record.tokenMint,
    tokenSymbol: record.tokenSymbol,
    message: record.message ?? undefined,
    visibility: record.visibility,
    paymentRail: record.paymentRail,
    paymentStatus: record.paymentStatus,
    txSignature: record.txSignature ?? undefined,
    clientRefId: record.clientRefId,
    createdAt: record.createdAt.toISOString(),
    confirmedAt: record.confirmedAt?.toISOString()
  };
}

function mapWithdrawal(record: {
  id: string;
  creatorId: string;
  amountBaseUnits: string;
  amountUi: Prisma.Decimal;
  tokenMint: string;
  tokenSymbol: string;
  paymentRail: TippitRail;
  txSignature: string | null;
  status: WithdrawalStatus;
  createdAt: Date;
  confirmedAt: Date | null;
}): WithdrawalRecord {
  return {
    id: record.id,
    creatorId: record.creatorId,
    amount: record.amountBaseUnits,
    amountUi: toNumber(record.amountUi),
    tokenMint: record.tokenMint,
    tokenSymbol: record.tokenSymbol,
    paymentRail: record.paymentRail,
    txSignature: record.txSignature ?? undefined,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    confirmedAt: record.confirmedAt?.toISOString()
  };
}

export async function upsertCreatorProfile(input: {
  walletAddress: string;
  slug: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isVerified?: boolean;
  isActive?: boolean;
  defaultRail?: "magicblock" | "umbra";
}) {
  const prisma = getPrismaClient();
  const existingBySlug = await prisma.creatorProfile.findUnique({ where: { slug: input.slug } });
  if (existingBySlug && existingBySlug.walletAddress !== input.walletAddress) {
    throw new Error("That public handle is already taken.");
  }

  const record = await prisma.creatorProfile.upsert({
    where: { walletAddress: input.walletAddress },
    update: {
      slug: input.slug,
      displayName: input.displayName,
      bio: input.bio || null,
      avatarUrl: input.avatarUrl || null,
      bannerUrl: input.bannerUrl || null,
      isVerified: input.isVerified,
      isActive: input.isActive,
      defaultRail: input.defaultRail
    },
    create: {
      walletAddress: input.walletAddress,
      slug: input.slug,
      displayName: input.displayName,
      bio: input.bio || null,
      avatarUrl: input.avatarUrl || null,
      bannerUrl: input.bannerUrl || null,
      isVerified: input.isVerified ?? false,
      isActive: input.isActive ?? true,
      defaultRail: input.defaultRail ?? "magicblock"
    }
  });

  return mapCreator(record);
}

export async function getCreatorBySlug(slug: string) {
  const prisma = getPrismaClient();
  const record = await prisma.creatorProfile.findFirst({
    where: { slug, isActive: true }
  });
  return record ? mapCreator(record) : null;
}

export async function getCreatorByWallet(walletAddress: string) {
  const prisma = getPrismaClient();
  const record = await prisma.creatorProfile.findFirst({
    where: { walletAddress, isActive: true }
  });
  return record ? mapCreator(record) : null;
}

export async function listFeaturedCreators() {
  const prisma = getPrismaClient();
  const records = await prisma.creatorProfile.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 6
  });
  return records.map(mapCreator);
}

export async function createTip(input: {
  creatorId: string;
  creatorSlug: string;
  fanWalletAddress?: string;
  amount: string;
  amountUi: number;
  tokenMint: string;
  tokenSymbol: string;
  message?: string;
  visibility: TipVisibilityType;
  clientRefId: string;
  paymentRail?: "magicblock" | "umbra";
}) {
  const prisma = getPrismaClient();
  const record = await prisma.tip.create({
    data: {
      creatorId: input.creatorId,
      creatorSlug: input.creatorSlug,
      fanWalletAddress: input.fanWalletAddress || null,
      amountBaseUnits: input.amount,
      amountUi: new Prisma.Decimal(input.amountUi),
      tokenMint: input.tokenMint,
      tokenSymbol: input.tokenSymbol,
      message: input.message || null,
      visibility: input.visibility,
      paymentRail: input.paymentRail ?? "magicblock",
      paymentStatus: "created",
      clientRefId: input.clientRefId
    }
  });
  return mapTip(record);
}

export async function getTipByClientRefId(clientRefId: string) {
  const prisma = getPrismaClient();
  const record = await prisma.tip.findUnique({ where: { clientRefId } });
  return record ? mapTip(record) : null;
}

export async function markTipSigned(clientRefId: string) {
  const prisma = getPrismaClient();
  const record = await prisma.tip.update({
    where: { clientRefId },
    data: { paymentStatus: "signed" }
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
    throw error;
  });
  return record ? mapTip(record) : null;
}

export async function markTipConfirmed(clientRefId: string, txSignature: string) {
  const prisma = getPrismaClient();
  const record = await prisma.tip.update({
    where: { clientRefId },
    data: {
      paymentStatus: "confirmed",
      txSignature,
      confirmedAt: new Date()
    }
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
    throw error;
  });
  return record ? mapTip(record) : null;
}

export async function listTipsByCreator(creatorId: string) {
  const prisma = getPrismaClient();
  const records = await prisma.tip.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" }
  });
  return records.map(mapTip);
}

export async function createWithdrawal(input: {
  creatorId: string;
  amount: string;
  amountUi: number;
  tokenMint: string;
  tokenSymbol: string;
  txSignature?: string;
  status?: "created" | "confirmed" | "failed";
}) {
  const prisma = getPrismaClient();
  const confirmedAt = input.status === "confirmed" ? new Date() : null;
  const record = await prisma.withdrawal.create({
    data: {
      creatorId: input.creatorId,
      amountBaseUnits: input.amount,
      amountUi: new Prisma.Decimal(input.amountUi),
      tokenMint: input.tokenMint,
      tokenSymbol: input.tokenSymbol,
      paymentRail: "magicblock",
      txSignature: input.txSignature || null,
      status: input.status ?? "created",
      confirmedAt
    }
  });
  return mapWithdrawal(record);
}

export async function markWithdrawalConfirmed(id: string, txSignature: string) {
  const prisma = getPrismaClient();
  const record = await prisma.withdrawal.update({
    where: { id },
    data: {
      status: "confirmed",
      txSignature,
      confirmedAt: new Date()
    }
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
    throw error;
  });
  return record ? mapWithdrawal(record) : null;
}

export async function listWithdrawalsByCreator(creatorId: string) {
  const prisma = getPrismaClient();
  const records = await prisma.withdrawal.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" }
  });
  return records.map(mapWithdrawal);
}

export async function getCreatorDashboard(input: { creator: CreatorProfileRecord; network: AppNetwork; hasMagicBlockSession: boolean }): Promise<CreatorDashboardPayload> {
  const [tips, withdrawals] = await Promise.all([
    listTipsByCreator(input.creator.id),
    listWithdrawalsByCreator(input.creator.id)
  ]);

  const confirmedTips = tips.filter((tip) => tip.paymentStatus === "confirmed");

  return {
    creator: input.creator,
    tips,
    withdrawals,
    totals: {
      confirmedTipCount: confirmedTips.length,
      confirmedTipAmountUi: confirmedTips.reduce((sum, tip) => sum + tip.amountUi, 0),
      publicTipCount: confirmedTips.filter((tip) => tip.visibility === "public").length
    },
    network: input.network,
    hasMagicBlockSession: input.hasMagicBlockSession
  };
}
