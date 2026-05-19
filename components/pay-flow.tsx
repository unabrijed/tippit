"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Coins, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { PaymentLinkRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SolanaPayQr } from "@/components/solana-pay-qr";
import { useNetwork } from "@/components/network-provider";
import { StatusPill } from "@/components/status-pill";
import { formatAmount, truncateAddress } from "@/lib/format";
import { createPrivatePayment } from "@/lib/umbra/browser";
import { getUmbraWalletSupport } from "@/lib/umbra/wallet";
import { withNetworkHeaders } from "@/lib/network-request";

function StepIndicator({ step }: { step: string }) {
  return (
    <div key={step} className="flex animate-enter items-center gap-3 motion-reduce:animate-none">
      <span className="h-2 w-2 animate-pulse rounded-full bg-ghost-pine dark:bg-ghost-ivory" />
      <span>{step}</span>
    </div>
  );
}

type State = { loading: boolean; step?: string; error?: string; success?: boolean; mode?: "public" | "private" };

const SOL_FEE_BUFFER = 0.00001;

export function PayFlow({ link }: { link: PaymentLinkRecord }) {
  const { publicKey, connected, signTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [state, setState] = useState<State>({ loading: false });
  const { config, network } = useNetwork();

  const networkMatches = link.network === network;
  const canPay = useMemo(() => link.status === "active" && !link.isExpired && networkMatches, [link.isExpired, link.status, networkMatches]);
  const umbraSupport = useMemo(() => getUmbraWalletSupport(wallet), [wallet]);
  const canPayPrivately = canPay && link.tokenType === "USDC" && connected && umbraSupport.supported;

  const ensureSufficientBalance = async () => {
    if (!publicKey) throw new Error("Connect a wallet before paying.");

    if (link.tokenType === "SOL") {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      const solBalance = lamports / 1_000_000_000;
      const required = link.amount + SOL_FEE_BUFFER;
      if (solBalance < required) {
        throw new Error(`Insufficient SOL balance. Need about ${required.toFixed(6)} SOL including fees.`);
      }
      return;
    }

    if (!link.tokenMint) {
      throw new Error("USDC mint is missing for this payment link.");
    }

    const mint = new PublicKey(link.tokenMint);
    const ata = getAssociatedTokenAddressSync(mint, publicKey);
    const accountInfo = await connection.getAccountInfo(ata, "confirmed");
    if (!accountInfo) {
      throw new Error(`No ${link.tokenSymbol} token account found in the connected wallet.`);
    }

    const balance = await connection.getTokenAccountBalance(ata, "confirmed");
    const available = Number(balance.value.uiAmountString ?? balance.value.uiAmount ?? 0);
    if (available < link.amount) {
      throw new Error(`Insufficient ${link.tokenSymbol} balance. Need ${link.amount} ${link.tokenSymbol}.`);
    }

    const lamports = await connection.getBalance(publicKey, "confirmed");
    if (lamports / 1_000_000_000 < SOL_FEE_BUFFER) {
      throw new Error("Not enough SOL to pay transaction fees for this USDC transfer.");
    }
  };

  const payPrivately = async () => {
    if (!connected) {
      setVisible(true);
      setState({ loading: false, error: "Connect Phantom or Solflare to pay privately with Umbra." });
      return;
    }

    if (!umbraSupport.supported) {
      setState({ loading: false, error: umbraSupport.reason ?? "Switch to Phantom or Solflare to use Umbra private payments." });
      return;
    }

    try {
      await ensureSufficientBalance();
      setState({ loading: true, step: "Creating private payment intent…", mode: "private" });
      const intentResponse = await fetch("/api/payment-intents", withNetworkHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentLinkId: link.id,
          payerWallet: publicKey?.toBase58(),
          amount: String(link.amount),
          tokenType: link.tokenType,
          tokenMint: link.tokenMint
        })
      }, network));
      const intentData = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(intentData.error ?? "Could not create payment intent.");

      const privateResult = await createPrivatePayment(wallet, {
        network,
        receiverAddress: link.receiverWallet,
        mint: link.tokenMint ?? "",
        amount: link.amount
      }, (step) => setState({ loading: true, step, mode: "private" }));
      const signature = privateResult.createUtxoSignature as string | undefined;
      if (!signature) throw new Error("Umbra did not return a payment signature.");

      setState({ loading: true, step: "Confirming private payment…", mode: "private" });
      const confirmResponse = await fetch(`/api/payment-intents/${intentData.id}/confirm`, withNetworkHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, umbraUtxoCommitment: signature })
      }, network));
      const confirmData = await confirmResponse.json();
      if (!confirmResponse.ok) throw new Error(confirmData.error ?? "Could not confirm private payment.");

      setState({ loading: false, success: true, mode: "private" });
      window.location.href = `/receipt/${confirmData.receipt.receiptCode}`;
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Private payment failed.", mode: "private" });
    }
  };

  const pay = async () => {
    if (!publicKey || !signTransaction) {
      if (!connected) {
        setVisible(true);
      }
      setState({ loading: false, error: "Connect a wallet that supports transaction signing." });
      return;
    }

    try {
      await ensureSufficientBalance();
      setState({ loading: true, step: "Creating payment intent…", mode: "public" });
      const intentResponse = await fetch("/api/payment-intents", withNetworkHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentLinkId: link.id,
          payerWallet: publicKey.toBase58(),
          amount: String(link.amount),
          tokenType: link.tokenType,
          tokenMint: link.tokenMint
        })
      }, network));
      const intentData = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(intentData.error ?? "Could not create payment intent.");

      setState({ loading: true, step: "Building Solana transaction…", mode: "public" });
      const txResponse = await fetch(`/api/payment-intents/${intentData.id}/build-transaction`, withNetworkHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payerWallet: publicKey.toBase58() })
      }, network));
      const txData = await txResponse.json();
      if (!txResponse.ok) throw new Error(txData.error ?? "Could not build transaction.");

      const transaction = Transaction.from(Buffer.from(txData.serializedTransaction, "base64"));
      const signed = await signTransaction(transaction);

      setState({ loading: true, step: "Submitting transaction…", mode: "public" });
      const signature = await connection.sendRawTransaction(signed.serialize());
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature, ...latestBlockhash }, "confirmed");

      setState({ loading: true, step: "Confirming payment…", mode: "public" });
      const confirmResponse = await fetch(`/api/payment-intents/${intentData.id}/confirm`, withNetworkHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature })
      }, network));
      const confirmData = await confirmResponse.json();
      if (!confirmResponse.ok) throw new Error(confirmData.error ?? "Could not confirm payment.");

      setState({ loading: false, success: true, mode: "public" });
      window.location.href = `/receipt/${confirmData.receipt.receiptCode}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed. Try again.";
      setState({ loading: false, error: message, mode: "public" });
    }
  };

  return (
    <Card className="border border-border bg-[linear-gradient(180deg,rgba(237,233,226,0.96),rgba(247,244,239,0.9))] shadow-soft dark:bg-[linear-gradient(180deg,rgba(35,33,30,0.95),rgba(23,22,20,0.96))]">
      <CardContent className="space-y-8 p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-ghost-smoke">Receiver verified as</p>
              <p className="text-lg font-semibold text-ghost-pine dark:text-ghost-ivory">{link.displayName}</p>
            </div>

            <div className="space-y-3 border-y border-border py-8">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-ghost-smoke">Amount due</p>
                <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-ghost-pine/20 bg-ghost-pine/5 px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ghost-pine dark:bg-ghost-ivory/10 dark:text-ghost-ivory">
                  <Coins aria-hidden className="h-3.5 w-3.5" />
                  {link.tokenSymbol}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-6xl leading-none text-ghost-ink dark:text-ghost-ivory">{link.amount}</span>
                <span className="mono-address text-sm uppercase tracking-[0.18em] text-ghost-smoke">{link.tokenSymbol}</span>
              </div>
              <p className="text-sm leading-6 text-ghost-smoke dark:text-[#C9C1B8]">{link.description || "Private payment. Receiver address hidden."}</p>
              {!networkMatches ? <p className="text-sm text-[#8A6A30]">This link was created on {link.network}. Switch the header network toggle from {config.label} before paying.</p> : null}
            </div>

            <div className="space-y-4 rounded-lg border border-ghost-pine/20 bg-ghost-pine/5 p-4 text-sm text-ghost-pine dark:bg-ghost-ivory/10 dark:text-ghost-ivory">
              <div className="flex items-start gap-3">
                <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5" />
                <div className="space-y-1">
                  <p className="font-medium">Private via Umbra</p>
                  <p className="text-ghost-smoke dark:text-[#D4CEC6]">SPL fallback + Umbra beta path with private UTXOs.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em]">
                <StatusPill status={link.status === "active" ? "active" : link.status}>{link.status}</StatusPill>
                <span className="rounded-md border border-border px-3 py-2">{link.tokenSymbol}</span>
                {link.receiverWallet ? <span className="rounded-md border border-border px-3 py-2">Wallet hidden</span> : null}
                <span className="rounded-md border border-border px-3 py-2">{link.network}</span>
              </div>
            </div>

            {link.isExpired ? <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"><WarningCircle className="mt-0.5 h-4 w-4" aria-hidden /><span>This payment link has expired.</span></div> : null}
            {state.error ? <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"><WarningCircle className="mt-0.5 h-4 w-4" aria-hidden /><span>{state.error}</span></div> : null}
            {state.success ? <div className="flex items-start gap-2 rounded-md border border-ghost-gold/40 bg-[linear-gradient(90deg,rgba(201,169,110,0.12),rgba(212,196,168,0.22),rgba(201,169,110,0.12))] px-4 py-3 text-sm text-ghost-smoke animate-shimmer"><CheckCircle className="mt-0.5 h-4 w-4 text-ghost-pine" aria-hidden /><span>{state.mode === "private" ? "Private payment sent." : "Payment sent."} Redirecting to your receipt.</span></div> : null}
            {state.loading && state.step ? (
              <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-ghost-smoke">
                <StepIndicator step={state.step} />
              </div>
            ) : null}

            {connected && publicKey ? <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-ghost-smoke">Paying from <span className="mono-address">{truncateAddress(publicKey.toBase58())}</span></div> : null}
            {!connected ? (
              <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-ghost-smoke">
                Connect a wallet to continue. Use Phantom or Solflare if you want the Umbra private-pay path for USDC.
              </div>
            ) : null}
            {connected && link.tokenType === "USDC" && !umbraSupport.supported ? (
              <div className="rounded-md border border-ghost-pine/20 bg-ghost-pine/5 px-4 py-3 text-sm text-ghost-smoke dark:text-[#D4CEC6]">
                Private pay uses Umbra through your connected wallet. Switch to Phantom or Solflare to enable it. Public pay is still available.
              </div>
            ) : null}
            {connected && link.tokenType === "USDC" && umbraSupport.supported ? (
              <div className="rounded-md border border-ghost-pine/20 bg-ghost-pine/5 px-4 py-3 text-sm text-ghost-smoke dark:text-[#D4CEC6]">
                Umbra private pay is ready with {umbraSupport.walletName ?? "your wallet"}. You may be asked to sign a consent message before the first private payment.
              </div>
            ) : null}

            {!networkMatches ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Switch the app network to {link.network} to pay this link.
              </div>
            ) : null}
            {link.tokenType === "SOL" ? (
              <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-ghost-smoke">
                This link accepts native SOL. Private Umbra pay is currently shown only for USDC links.
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={connected ? pay : () => setVisible(true)} disabled={!canPay || state.loading} aria-busy={state.loading}>
                {state.loading && state.mode === "public" ? state.step ?? "Processing…" : !connected ? "Connect wallet" : `Pay ${formatAmount(link.amount, link.tokenSymbol)}`}
              </Button>
              <Button onClick={!connected ? () => setVisible(true) : payPrivately} disabled={!canPay || state.loading || (connected && !canPayPrivately)} aria-busy={state.loading} variant="secondary">
                {state.loading && state.mode === "private"
                  ? state.step ?? "Processing…"
                  : !connected
                    ? "Connect Phantom or Solflare"
                    : link.tokenType !== "USDC"
                      ? "Private pay for USDC only"
                      : canPayPrivately
                        ? "Pay privately with Umbra"
                        : "Switch wallet for Umbra"}
              </Button>
            </div>
          </div>

          <SolanaPayQr slug={link.slug} />
        </div>
      </CardContent>
    </Card>
  );
}
