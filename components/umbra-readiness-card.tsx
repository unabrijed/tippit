"use client";

import { ShieldCheck } from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent } from "@/components/ui/card";
import { UmbraRegisterButton } from "@/components/umbra-register-button";
import { useNetwork } from "@/components/network-provider";
import { getUmbraWalletSupport } from "@/lib/umbra/wallet";

export function UmbraReadinessCard() {
  const { wallet, connected } = useWallet();
  const support = getUmbraWalletSupport(wallet);
  const { config, network } = useNetwork();
  const isMainnet = network === "mainnet";

  return (
    <Card>
      <CardContent className="space-y-5 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/80 bg-[linear-gradient(135deg,rgba(83,115,255,0.12),rgba(80,190,255,0.16))] text-[#4357d0] shadow-[0_12px_30px_rgba(83,115,255,0.14)]">
            <ShieldCheck aria-hidden className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xl font-semibold tracking-[-0.03em] text-foreground">Umbra readiness</p>
            <p className="text-sm leading-6 text-muted-foreground">Register wallet. Create private USDC tip. Claim from monitor.</p>
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-muted-foreground">
          {!isMainnet
            ? "Umbra private payments are only available on mainnet. Switch network to register."
            : !connected
              ? "Connect a compatible wallet to register and use private tipping."
              : support.supported
                ? `Ready with ${support.walletName ?? "your wallet"}.`
                : support.reason}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ReadinessTile label="Network" value={config.label} />
          <ReadinessTile label="Indexer" value="Configured" />
          <ReadinessTile label="Relayer" value="Configured" />
        </div>
        {isMainnet && <UmbraRegisterButton />}
      </CardContent>
    </Card>
  );
}

function ReadinessTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
