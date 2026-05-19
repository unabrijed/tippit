import type { Wallet } from "@solana/wallet-adapter-react";

export const UMBRA_SUPPORTED_WALLET_NAMES = ["Phantom", "Solflare"] as const;

export type UmbraWalletSupport = {
  supported: boolean;
  walletName?: string;
  reason?: string;
};

function hasFeatureSet(features: Record<string, unknown> | undefined, candidates: string[]) {
  if (!features) return false;
  return candidates.some((feature) => feature in features);
}

export function getUmbraWalletSupport(wallet: Wallet | null): UmbraWalletSupport {
  if (!wallet) {
    return { supported: false, reason: "Connect Phantom or Solflare to use Umbra private payments." };
  }

  const adapter = wallet.adapter as any;
  const walletName = typeof adapter?.name === "string" ? adapter.name : undefined;
  const standardWallet = adapter?.wallet;
  const account = standardWallet?.accounts?.[0];
  const features = standardWallet?.features as Record<string, unknown> | undefined;

  const hasWalletStandard = Boolean(adapter?.standard && standardWallet && account);
  const hasMessageSigning = hasFeatureSet(features, ["solana:signMessage"]);
  const hasTransactionSigning = hasFeatureSet(features, ["solana:signTransaction", "solana:signAndSendTransaction"]);

  if (!hasWalletStandard || !hasMessageSigning || !hasTransactionSigning) {
    return {
      supported: false,
      walletName,
      reason: `${walletName ?? "This wallet"} does not expose the signing features Umbra needs. Switch to Phantom or Solflare in browser mode.`
    };
  }

  return { supported: true, walletName };
}
