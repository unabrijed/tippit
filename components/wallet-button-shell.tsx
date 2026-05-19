"use client";

import { SolanaWalletProvider } from "@/components/solana-wallet-provider";
import { WalletButton } from "@/components/wallet-button";

export function WalletButtonShell() {
  return (
    <SolanaWalletProvider>
      <WalletButton />
    </SolanaWalletProvider>
  );
}
