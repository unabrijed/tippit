import type { AppNetwork } from "@/lib/network";
import { magicBlockFetch, withCluster } from "@/lib/magicblock/api";
import type { MagicBlockUnsignedTransaction } from "@/lib/tippit/types";

// MagicBlock requires clientRefId to be a non-negative bigint string.
// Derive one by treating the first 15 hex digits of the UUID (without hyphens) as a BigInt.
function toNumericRefId(uuid: string): string {
  const hex = uuid.replace(/-/g, "").slice(0, 15);
  return BigInt(`0x${hex}`).toString();
}

export async function createMagicBlockTipTx(input: {
  fanWallet: string;
  creatorWallet: string;
  amountBaseUnits: string;
  mint: string;
  clientRefId: string;
  network: AppNetwork;
  token?: string;
}) {
  return magicBlockFetch<MagicBlockUnsignedTransaction>("/v1/spl/transfer", {
    method: "POST",
    token: input.token,
    body: JSON.stringify(withCluster(input.network, {
      from: input.fanWallet,
      to: input.creatorWallet,
      mint: input.mint,
      amount: Number(input.amountBaseUnits),
      visibility: "private",
      fromBalance: "base",
      toBalance: "ephemeral",
      initIfMissing: true,
      initAtasIfMissing: true,
      initVaultIfMissing: true,
      clientRefId: toNumericRefId(input.clientRefId),
      split: 1,
      gasless: false,
      minDelayMs: "0",
      maxDelayMs: "0"
    }))
  });
}
