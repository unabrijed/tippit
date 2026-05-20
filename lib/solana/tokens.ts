import type { AppNetwork } from "@/lib/network";

export type SupportedToken = "USDC" | "SOL";

export const DEFAULT_USDC_MINT_BY_NETWORK: Record<AppNetwork, string> = {
  mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
};

export const DEFAULT_SOL_AMOUNT = 0.001;
export const DEFAULT_USDC_AMOUNT = 1;
export const DEFAULT_USDC_DECIMALS = 6;
export const DEFAULT_SOL_DECIMALS = 9;
export const DEFAULT_USDC_SYMBOL = "USDC";
export const DEFAULT_SOL_SYMBOL = "SOL";

export function getDefaultUsdcMint(network: AppNetwork) {
  return DEFAULT_USDC_MINT_BY_NETWORK[network];
}

export function getTokenConfig(token: SupportedToken, network: AppNetwork) {
  if (token === "SOL") {
    return {
      symbol: DEFAULT_SOL_SYMBOL,
      decimals: DEFAULT_SOL_DECIMALS,
      mint: undefined,
      defaultAmount: DEFAULT_SOL_AMOUNT,
      type: "native" as const
    };
  }

  return {
    symbol: DEFAULT_USDC_SYMBOL,
    decimals: DEFAULT_USDC_DECIMALS,
    mint: getDefaultUsdcMint(network),
    defaultAmount: DEFAULT_USDC_AMOUNT,
    type: "spl" as const
  };
}
