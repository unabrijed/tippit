"use client";

import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent } from "@/components/ui/card";
import { UmbraRegisterButton } from "@/components/umbra-register-button";
import { useNetwork } from "@/components/network-provider";
import { getUmbraWalletSupport } from "@/lib/umbra/wallet";

export function UmbraReadinessCard() {
  const { wallet, connected } = useWallet();
  const support = getUmbraWalletSupport(wallet);
  const { config } = useNetwork();

  return (
    <Card className="bg-card/80">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ghost-pine/10 text-ghost-pine dark:bg-ghost-ivory/10 dark:text-ghost-ivory">
            <ShieldCheck aria-hidden className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-ghost-ink dark:text-ghost-ivory">Umbra execution layer is now partially live</p>
            <p className="text-sm leading-6 text-ghost-smoke dark:text-[#C9C1B8]">
              Wallet registration is wired, private receiver-claimable sends can be attempted from checkout, and claim flows can now be executed from the merchant dashboard.
            </p>
          </div>
        </div>
        <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-ghost-smoke dark:text-[#C9C1B8]">
          {!connected
            ? "Connect Phantom or Solflare to register for Umbra and use private payments."
            : support.supported
              ? `Umbra is ready with ${support.walletName ?? "your wallet"}.`
              : support.reason}
        </div>
        <div className="grid gap-3 text-xs uppercase tracking-[0.18em] text-ghost-smoke md:grid-cols-3 dark:text-[#C9C1B8]">
          <div className="rounded-md border border-border px-3 py-3">Network · {config.label}</div>
          <div className="rounded-md border border-border px-3 py-3">Indexer · configured</div>
          <div className="rounded-md border border-border px-3 py-3">Relayer · configured</div>
        </div>
        <UmbraRegisterButton />
      </CardContent>
    </Card>
  );
}
