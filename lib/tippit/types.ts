import type { AppNetwork } from "@/lib/network";

export type TippitRail = "magicblock" | "umbra";
export type TipVisibility = "public" | "creator_only" | "anonymous";
export type TipStatus = "created" | "signed" | "confirmed" | "failed";
export type WithdrawalStatus = "created" | "confirmed" | "failed";

export type CreatorProfileRecord = {
  id: string;
  walletAddress: string;
  slug: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  defaultRail: TippitRail;
  createdAt: string;
  updatedAt: string;
};

export type TipRecord = {
  id: string;
  creatorId: string;
  creatorSlug: string;
  fanWalletAddress?: string;
  amount: string;
  amountUi: number;
  tokenMint: string;
  tokenSymbol: string;
  message?: string;
  visibility: TipVisibility;
  paymentRail: TippitRail;
  paymentStatus: TipStatus;
  txSignature?: string;
  clientRefId: string;
  createdAt: string;
  confirmedAt?: string;
};

export type WithdrawalRecord = {
  id: string;
  creatorId: string;
  amount: string;
  amountUi: number;
  tokenMint: string;
  tokenSymbol: string;
  paymentRail: TippitRail;
  txSignature?: string;
  status: WithdrawalStatus;
  createdAt: string;
  confirmedAt?: string;
};

export type CreatorDashboardPayload = {
  creator: CreatorProfileRecord;
  tips: TipRecord[];
  withdrawals: WithdrawalRecord[];
  totals: {
    confirmedTipCount: number;
    confirmedTipAmountUi: number;
    publicTipCount: number;
  };
  network: AppNetwork;
  hasMagicBlockSession: boolean;
};

export type MagicBlockUnsignedTransaction = {
  transactionBase64: string;
  recentBlockhash?: string;
  lastValidBlockHeight?: number;
  instructionCount?: number;
  requiredSigners?: string[];
  kind?: string;
  version?: string;
  sendTo?: "base" | "ephemeral";
  validator?: string;
};
