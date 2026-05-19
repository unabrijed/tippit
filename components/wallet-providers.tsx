"use client";

import { useEffect, useMemo, useState } from "react";
import type { Adapter } from "@solana/wallet-adapter-base";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ThemeProvider } from "@/components/theme-provider";
import { NetworkProvider, useNetwork } from "@/components/network-provider";
import "@solana/wallet-adapter-react-ui/styles.css";

function WalletLayer({ children }: { children: React.ReactNode }) {
  const { config } = useNetwork();
  const [wallets, setWallets] = useState<Adapter[]>([]);

  const walletNetwork = useMemo(
    () => (config.cluster === "mainnet-beta" ? WalletAdapterNetwork.Mainnet : WalletAdapterNetwork.Devnet),
    [config.cluster]
  );

  useEffect(() => {
    let active = true;

    Promise.all([
      import("@solana/wallet-adapter-phantom").then((m) => new m.PhantomWalletAdapter()),
      import("@solana/wallet-adapter-solflare").then((m) => new m.SolflareWalletAdapter({ network: walletNetwork }))
    ]).then((adapters) => {
      if (active) setWallets(adapters);
    });

    return () => {
      active = false;
      adaptersCleanup(wallets);
    };
  }, [walletNetwork]);

  return (
    <ConnectionProvider endpoint={config.rpcUrl}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function adaptersCleanup(wallets: Adapter[]) {
  wallets.forEach((wallet) => {
    try {
      wallet.disconnect();
    } catch {
      // ignore cleanup errors
    }
  });
}

export function WalletProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <WalletLayer>{children}</WalletLayer>
      </NetworkProvider>
    </ThemeProvider>
  );
}
