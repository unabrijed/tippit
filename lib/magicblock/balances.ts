import type { AppNetwork } from "@/lib/network";
import { magicBlockFetch } from "@/lib/magicblock/api";

export async function getPrivateBalance(input: {
  address: string;
  mint: string;
  token: string;
  network: AppNetwork;
}) {
  const search = new URLSearchParams({
    address: input.address,
    mint: input.mint,
    cluster: input.network === "mainnet" ? "mainnet" : "devnet"
  });

  return magicBlockFetch<{
    address: string;
    mint: string;
    balance: string;
    uiAmount?: number;
    decimals?: number;
  }>(`/v1/spl/private-balance?${search.toString()}`, {
    token: input.token
  });
}
