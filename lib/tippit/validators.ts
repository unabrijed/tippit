import { z } from "zod";

export const creatorProfileSchema = z.object({
  walletAddress: z.string().min(32),
  slug: z.string().min(3).max(32).regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(2).max(60),
  bio: z.string().max(280).optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  defaultRail: z.enum(["magicblock", "umbra"]).optional()
});

export const createTipSchema = z.object({
  creatorSlug: z.string().min(1),
  amount: z.string().regex(/^\d+$/),
  amountUi: z.number().positive(),
  message: z.string().max(240).optional().or(z.literal("")),
  visibility: z.enum(["public", "creator_only", "anonymous"]).default("creator_only"),
  fanWalletAddress: z.string().min(32).optional()
});

export const buildTipTransferSchema = z.object({
  clientRefId: z.string().min(1),
  fanWallet: z.string().min(32),
  token: z.string().min(1).optional()
});

export const confirmTipSchema = z.object({
  clientRefId: z.string().min(1),
  txSignature: z.string().min(1)
});

export const challengeSchema = z.object({
  walletAddress: z.string().min(32)
});

export const loginSchema = z.object({
  walletAddress: z.string().min(32),
  challenge: z.string().min(1),
  signature: z.string().min(1)
});

export const withdrawSchema = z.object({
  amount: z.string().regex(/^\d+$/),
  amountUi: z.number().positive(),
  txSignature: z.string().min(1).optional(),
  withdrawalId: z.string().uuid().optional()
});
