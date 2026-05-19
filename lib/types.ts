import type { AppNetwork } from "@/lib/network";
import type { SupportedToken } from "@/lib/solana/tokens";

export type PaymentStatus = "created" | "awaiting_signature" | "submitted" | "confirmed" | "claimable" | "claimed" | "failed" | "expired";

export type LinkStatus = "draft" | "active" | "paid" | "expired" | "cancelled";

export type MerchantRecord = {
  id: string;
  walletAddress: string;
  displayName: string;
  network: AppNetwork;
  createdAt: string;
};

export type PaymentLinkRecord = {
  id: string;
  merchantId: string;
  receiverWallet: string;
  displayName: string;
  slug: string;
  title: string;
  description?: string;
  amount: number;
  tokenType: SupportedToken;
  tokenMint?: string;
  tokenSymbol: string;
  network: AppNetwork;
  linkType: "one_time" | "reusable";
  privacyMode: "umbra_utxo" | "public_transfer";
  status: LinkStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  isExpired?: boolean;
};

export type PaymentIntentRecord = {
  id: string;
  paymentLinkId: string;
  linkTitle: string;
  receiverWallet: string;
  payerWallet?: string;
  amount: number;
  tokenType: SupportedToken;
  tokenMint?: string;
  tokenSymbol: string;
  network: AppNetwork;
  status: PaymentStatus;
  solanaSignature?: string;
  claimSignature?: string;
  umbraUtxoCommitment?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type ReceiptRecord = {
  id: string;
  paymentIntentId: string;
  receiptCode: string;
  status: "issued";
  intentStatus: PaymentStatus;
  amount: number;
  tokenSymbol: string;
  network: AppNetwork;
  displayName: string;
  createdAt: string;
};

export type DashboardPayload = {
  links: PaymentLinkRecord[];
  intents: PaymentIntentRecord[];
};
