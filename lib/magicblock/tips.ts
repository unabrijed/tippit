import type { AppNetwork } from "@/lib/network";
import { magicBlockFetch, withCluster } from "@/lib/magicblock/api";
import type { MagicBlockUnsignedTransaction } from "@/lib/tippit/types";

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
      memo: `Tippit:${input.clientRefId}`,
      clientRefId: input.clientRefId,
      split: 1,
      gasless: true,
      minDelayMs: "0",
      maxDelayMs: "0"
    }))
  });
}
