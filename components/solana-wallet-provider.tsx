"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useNetwork } from "@/components/network-provider";
import "@solana/wallet-adapter-react-ui/styles.css";

// Wallet Standard wallets (Phantom, Solflare, Backpack, etc.) are auto-discovered
// by WalletProvider via the Wallet Standard window.navigator.wallets registry.
// Passing explicit legacy adapters here would surface non-standard adapter instances
// that lack adapter.standard and adapter.wallet — breaking Umbra's signing requirements.
export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const { config } = useNetwork();

  return (
    <ConnectionProvider endpoint={config.rpcUrl}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
