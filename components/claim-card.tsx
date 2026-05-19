"use client";

import { useState } from "react";
import { CheckCircle, Sparkle, WarningCircle } from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { PaymentIntentRecord } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { formatAmount, truncateAddress } from "@/lib/format";
import { claimLatestPrivatePayment } from "@/lib/umbra/browser";
import { useNetwork } from "@/components/network-provider";
import { withNetworkHeaders } from "@/lib/network-request";
import { getUmbraWalletSupport } from "@/lib/umbra/wallet";

type State = { loading: boolean; error?: string; receiptCode?: string; step?: string };

export function ClaimCard({ intent }: { intent: PaymentIntentRecord }) {
  const { wallet, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [state, setState] = useState<State>({ loading: false });
  const support = getUmbraWalletSupport(wallet);
  const { network } = useNetwork();
  const requiresUmbraWallet = Boolean(intent.umbraUtxoCommitment);

  const claim = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }

    if (requiresUmbraWallet && !support.supported) {
      setState({ loading: false, error: support.reason });
      return;
    }

    try {
      setState({ loading: true, step: "Preparing claim…" });

      if (requiresUmbraWallet) {
        const claimResult = await claimLatestPrivatePayment(wallet, { receiverAddress: intent.receiverWallet, amount: intent.amount, network }, (step) => setState({ loading: true, step }));
        const response = await fetch(`/api/payment-intents/${intent.id}/claim`, withNetworkHeaders({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claimSignature: claimResult.claimSignature })
        }, network));
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Claim failed.");
        setState({ loading: false, receiptCode: data.receipt?.receiptCode });
        window.location.href = `/receipt/${data.receipt.receiptCode}`;
        return;
      }

      const response = await fetch(`/api/payment-intents/${intent.id}/claim`, withNetworkHeaders({ method: "POST" }, network));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Claim failed.");
      setState({ loading: false, receiptCode: data.receipt?.receiptCode });
      window.location.href = `/receipt/${data.receipt.receiptCode}`;
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Claim failed." });
    }
  };

  return (
    <Card className="bg-card/80">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-ghost-smoke">Payment ready to claim</p>
            <h3 className="text-lg font-semibold text-ghost-ink dark:text-ghost-ivory">{formatAmount(intent.amount, intent.tokenSymbol)} from {intent.linkTitle}</h3>
            <p className="text-sm text-ghost-smoke dark:text-[#C9C1B8]">Payer {intent.payerWallet ? truncateAddress(intent.payerWallet) : "not shared"} · {intent.status.replace(/_/g, " ")}</p>
          </div>
          <StatusPill status={intent.status}>{intent.status}</StatusPill>
        </div>

        {state.error ? <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"><WarningCircle className="mt-0.5 h-4 w-4" aria-hidden /><span>{state.error}</span></div> : null}
        {state.step && state.loading ? <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-ghost-smoke">{state.step}</div> : null}
        {state.receiptCode ? <div className="flex items-start gap-2 rounded-md border border-ghost-gold/40 bg-[linear-gradient(90deg,rgba(201,169,110,0.12),rgba(212,196,168,0.22),rgba(201,169,110,0.12))] px-4 py-3 text-sm text-ghost-smoke animate-shimmer"><CheckCircle className="mt-0.5 h-4 w-4 text-ghost-pine" aria-hidden /><span>Claim complete. Redirecting to receipt {state.receiptCode}.</span></div> : null}
        {requiresUmbraWallet && connected && !support.supported ? (
          <div className="rounded-md border border-ghost-pine/20 bg-ghost-pine/5 px-4 py-3 text-sm text-ghost-smoke dark:text-[#D4CEC6]">
            This private claim uses Umbra. Switch to Phantom or Solflare to finish claiming it.
          </div>
        ) : null}

        <Button onClick={claim} disabled={state.loading || intent.status === "claimed" || (connected && requiresUmbraWallet && !support.supported)} aria-busy={state.loading}>
          <Sparkle aria-hidden className="h-4 w-4" />
          {state.loading
            ? state.step ?? "Claiming…"
            : intent.status === "claimed"
              ? "Already claimed"
              : !connected
                ? "Connect wallet to claim"
                : requiresUmbraWallet && !support.supported
                  ? "Switch wallet for Umbra"
                  : requiresUmbraWallet
                    ? "Claim privately with Umbra"
                    : "Finalize claim"}
        </Button>
      </CardContent>
    </Card>
  );
}
