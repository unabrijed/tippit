"use client";

import { useState } from "react";
import { Copy, ArrowSquareOut, SignOut, Wallet, CaretDown } from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { truncateAddress } from "@/lib/format";
import { explorerAddressUrl } from "@/lib/solana/explorer";
import { Button } from "@/components/ui/button";
import { useNetwork } from "@/components/network-provider";

export function WalletButton() {
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const { network } = useNetwork();

  if (connecting) {
    return (
      <Button disabled size="lg">
        Connecting…
      </Button>
    );
  }

  if (!connected || !publicKey) {
    return (
      <Button size="lg" onClick={() => setVisible(true)}>
        <Wallet aria-hidden className="h-4 w-4" />
        Connect wallet
        <CaretDown aria-hidden className="h-4 w-4 opacity-70" />
      </Button>
    );
  }

  const copy = async () => {
    await navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-2">
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-ghost-smoke transition hover:bg-ghost-pine/5 hover:text-ghost-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:text-[#C9C1B8] dark:hover:bg-ghost-ivory/10 dark:hover:text-ghost-ivory"
        aria-label="Change wallet"
      >
        <Wallet className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Change</span>
      </button>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-ghost-ink transition hover:bg-ghost-pine/5 hover:text-ghost-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:text-ghost-ivory"
        aria-label="Copy connected wallet address"
      >
        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
        <span className="mono-address">{truncateAddress(publicKey.toBase58())}</span>
        <Copy className="h-4 w-4" aria-hidden />
        <span className="sr-only">{copied ? "Copied" : "Copy address"}</span>
      </button>
      <a
        href={explorerAddressUrl(publicKey.toBase58(), network)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-ghost-smoke transition hover:bg-ghost-pine/5 hover:text-ghost-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-ghost-ivory/10 dark:hover:text-ghost-ivory"
        aria-label="Open connected wallet in explorer"
      >
        <ArrowSquareOut className="h-4 w-4" aria-hidden />
      </a>
      <button
        type="button"
        onClick={() => disconnect()}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-ghost-smoke transition hover:bg-ghost-pine/5 hover:text-ghost-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-ghost-ivory/10 dark:hover:text-ghost-ivory"
        aria-label="Disconnect wallet"
      >
        <SignOut className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
