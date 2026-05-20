"use client";

import { useState } from "react";
import { ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { PaymentIntentRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/brand-primitives";
import { formatAmount } from "@/lib/format";
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
    if (!connected) { setVisible(true); return; }
    if (requiresUmbraWallet && !support.supported) { setState({ loading: false, error: support.reason }); return; }

    try {
      setState({ loading: true, step: "Claiming…" });
      if (requiresUmbraWallet) {
        const claimResult = await claimLatestPrivatePayment(wallet, { receiverAddress: intent.receiverWallet, amount: intent.amount, network }, (step) => setState({ loading: true, step }));
        const response = await fetch(`/api/payment-intents/${intent.id}/claim`, withNetworkHeaders({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claimSignature: claimResult.claimSignature }) }, network));
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
    <div className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition ${
      state.error ? "border-destructive/20 bg-destructive/5" : "border-border bg-white"
    }`}>
      <StatusDot status={intent.status} />

      <div className="flex-1 min-w-0">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {formatAmount(intent.amount, intent.tokenSymbol)}
        </span>
      </div>

      {state.error ? (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <WarningCircle className="h-3.5 w-3.5" />
          {state.error}
        </span>
      ) : null}

      {state.loading ? (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          {state.step}
        </span>
      ) : null}

      {intent.status !== "claimed" && !state.loading ? (
        <Button
          size="sm"
          onClick={claim}
          disabled={state.loading || (connected && requiresUmbraWallet && !support.supported)}
        >
          <ShieldCheck className="h-4 w-4" />
          Claim
        </Button>
      ) : null}

      {intent.status === "claimed" ? (
        <span className="text-xs text-muted-foreground">Claimed</span>
      ) : null}
    </div>
  );
}
