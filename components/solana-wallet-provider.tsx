"use client";

import { useEffect, useMemo, useState } from "react";
import type { Adapter } from "@solana/wallet-adapter-base";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useNetwork } from "@/components/network-provider";
import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const { config } = useNetwork();
  const [wallets, setWallets] = useState<Adapter[]>([]);

  const walletNetwork = useMemo(
    () => (config.cluster === "mainnet-beta" ? WalletAdapterNetwork.Mainnet : WalletAdapterNetwork.Devnet),
    [config.cluster]
  );

  useEffect(() => {
    let active = true;
    let localWallets: Adapter[] = [];

    Promise.all([
      import("@solana/wallet-adapter-phantom").then((m) => new m.PhantomWalletAdapter()),
      import("@solana/wallet-adapter-solflare").then((m) => new m.SolflareWalletAdapter({ network: walletNetwork }))
    ]).then((adapters) => {
      localWallets = adapters;
      if (active) {
        setWallets(adapters);
      } else {
        adaptersCleanup(adapters);
      }
    });

    return () => {
      active = false;
      adaptersCleanup(localWallets);
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
