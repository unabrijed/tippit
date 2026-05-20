import type { AppNetwork } from "@/lib/network";
import { magicBlockFetch, withCluster } from "@/lib/magicblock/api";
import type { MagicBlockUnsignedTransaction } from "@/lib/tippit/types";

export async function createWithdrawTx(input: {
  creatorWallet: string;
  amountBaseUnits: string;
  mint: string;
  token: string;
  network: AppNetwork;
}) {
  return magicBlockFetch<MagicBlockUnsignedTransaction>("/v1/spl/withdraw", {
    method: "POST",
    token: input.token,
    body: JSON.stringify(withCluster(input.network, {
      owner: input.creatorWallet,
      mint: input.mint,
      amount: Number(input.amountBaseUnits)
    }))
  });
}
