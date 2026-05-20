import type { AppNetwork } from "@/lib/network";

export const DEFAULT_TOKEN_SYMBOL = "USDC";

const DEFAULT_USDC_MINTS: Record<AppNetwork, string> = {
  mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
};

export function getUsdcMint(network: AppNetwork) {
  const envKey = network === "mainnet" ? process.env.NEXT_PUBLIC_USDC_MINT : process.env.NEXT_PUBLIC_USDC_MINT_DEVNET;
  return envKey || DEFAULT_USDC_MINTS[network];
}

export const MAGICBLOCK_TOKEN_COOKIE = "tippit_mb_token";
export const CREATOR_WALLET_COOKIE = "tippit_creator_wallet";
export const CREATOR_SLUG_COOKIE = "tippit_creator_slug";
