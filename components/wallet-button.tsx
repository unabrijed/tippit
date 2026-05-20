"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, SignOut, Wallet } from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { truncateAddress } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function WalletButton() {
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (connecting) {
    return (
      <Button disabled size="sm" variant="secondary">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
      </Button>
    );
  }

  if (!connected || !publicKey) {
    return (
      <Button size="sm" onClick={() => setVisible(true)}>
        <Wallet aria-hidden className="h-4 w-4" />
        <span className="hidden sm:inline">Connect</span>
      </Button>
    );
  }

  const copy = async () => {
    await navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-white px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
        <span className="mono-address text-xs">{truncateAddress(publicKey.toBase58())}</span>
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 animate-scale-in rounded-xl border border-border bg-white p-1 shadow-soft">
          <button
            type="button"
            onClick={() => { copy(); setMenuOpen(false); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            <Copy className="h-4 w-4 text-muted-foreground" aria-hidden />
            {copied ? "Copied!" : "Copy address"}
          </button>
          <button
            type="button"
            onClick={() => { disconnect(); setMenuOpen(false); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/5"
          >
            <SignOut className="h-4 w-4" aria-hidden />
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
