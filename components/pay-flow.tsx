"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Lock, LockOpen, WarningCircle } from "@phosphor-icons/react";
import { Connection, PublicKey, Transaction, type VersionedTransaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { PaymentLinkRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SolanaPayQr } from "@/components/solana-pay-qr";
import { useNetwork } from "@/components/network-provider";
import { usePaymentRail } from "@/components/payment-rail-provider";
import { StatusDot } from "@/components/brand-primitives";
import { formatAmount } from "@/lib/format";
import { extractApiError } from "@/lib/api-error";
import { createPrivatePayment } from "@/lib/umbra/browser";
import { getUmbraWalletSupport } from "@/lib/umbra/wallet";
import { withNetworkHeaders } from "@/lib/network-request";
import { deserializeMagicBlockTransaction, resolveMagicBlockRpc } from "@/lib/magicblock/tx";
import { getUsdcMint } from "@/lib/tippit/constants";

type State = { loading: boolean; step?: string; error?: string; success?: boolean; mode?: "magicblock" | "umbra" | "public" };
type BalanceState = { value: number | null; loading: boolean };

const SOL_FEE_BUFFER = 0.00001;

function useWalletTokenBalance(tokenType: "USDC" | "SOL" | string, tokenMint: string | null | undefined, network: string) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<BalanceState>({ value: null, loading: false });

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalance({ value: null, loading: false });
      return;
    }

    let cancelled = false;
    setBalance({ value: null, loading: true });

    (async () => {
      try {
        if (tokenType === "SOL") {
          const lamports = await connection.getBalance(publicKey, "confirmed");
          if (!cancelled) setBalance({ value: lamports / 1_000_000_000, loading: false });
        } else {
          const mintAddress = tokenMint ?? getUsdcMint(network as "mainnet" | "devnet");
          const mint = new PublicKey(mintAddress);
          const ata = getAssociatedTokenAddressSync(mint, publicKey);
          const accountInfo = await connection.getAccountInfo(ata, "confirmed");
          if (!accountInfo) {
            // No ATA exists — wallet has never held this token on this network.
            // Return null (shown as "—") rather than 0 to avoid confusion with an actual zero balance.
            if (!cancelled) setBalance({ value: null, loading: false });
            return;
          }
          const tokenBalance = await connection.getTokenAccountBalance(ata, "confirmed");
          const amount = Number(tokenBalance.value.uiAmountString ?? tokenBalance.value.uiAmount ?? 0);
          if (!cancelled) setBalance({ value: amount, loading: false });
        }
      } catch {
        if (!cancelled) setBalance({ value: null, loading: false });
      }
    })();

    return () => { cancelled = true; };
  }, [connected, publicKey, connection, tokenType, tokenMint, network]);

  return balance;
}

export function PayFlow({ link }: { link: PaymentLinkRecord }) {
  const { publicKey, connected, signTransaction, signMessage, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [state, setState] = useState<State>({ loading: false });
  const { config, network } = useNetwork();
  const { rail, setRail } = usePaymentRail();

  const walletBalance = useWalletTokenBalance(link.tokenType, link.tokenMint, network);

  const networkMatches = link.network === network;
  const isSolPayment = link.tokenType === "SOL";
  const solDisabled = isSolPayment;
  const canPay = useMemo(() => link.status === "active" && !link.isExpired && networkMatches && !solDisabled, [link.isExpired, link.status, networkMatches, solDisabled]);
  const umbraSupport = useMemo(() => getUmbraWalletSupport(wallet), [wallet]);
  const canPayPrivately = canPay && link.tokenType === "USDC" && connected && umbraSupport.supported;

  // SOL is not supported for private transfers — force public rail
  useEffect(() => {
    if (isSolPayment && rail === "magicblock") setRail("umbra");
  }, [isSolPayment, rail, setRail]);

  const ensureSufficientBalance = async () => {
    if (!publicKey) throw new Error("Connect wallet.");

    if (link.tokenType === "SOL") {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      const solBalance = lamports / 1_000_000_000;
      const required = link.amount + SOL_FEE_BUFFER;
      if (solBalance < required) throw new Error(`Need ~${required.toFixed(4)} SOL`);
      return;
    }

    if (!link.tokenMint) throw new Error("Mint missing.");
    const mint = new PublicKey(link.tokenMint);
    const ata = getAssociatedTokenAddressSync(mint, publicKey);
    const accountInfo = await connection.getAccountInfo(ata, "confirmed");
    if (!accountInfo) throw new Error(`No ${link.tokenSymbol} account found.`);
    const balance = await connection.getTokenAccountBalance(ata, "confirmed");
    const available = Number(balance.value.uiAmountString ?? balance.value.uiAmount ?? 0);
    if (available < link.amount) throw new Error(`Need ${link.amount} ${link.tokenSymbol} (have ${available}).`);
    const lamports = await connection.getBalance(publicKey, "confirmed");
    if (lamports / 1_000_000_000 < SOL_FEE_BUFFER) throw new Error("Need a small amount of SOL for transaction fees.");
  };

  const payMagicBlock = async () => {
    if (!publicKey || !signTransaction) {
      if (!connected) setVisible(true);
      return;
    }
    try {
      setState({ loading: true, step: "Creating…", mode: "magicblock" });
      const intentResponse = await fetch("/api/payment-intents", withNetworkHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentLinkId: link.id, payerWallet: publicKey.toBase58(), amount: String(link.amount), tokenType: link.tokenType, tokenMint: link.tokenMint })
      }, network));
      const intentData = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(extractApiError(intentData, "Intent failed."));

      setState({ loading: true, step: "Authenticating…", mode: "magicblock" });
      let mbToken: string | undefined;
      if (signMessage) {
        console.log("[pay-flow] starting MagicBlock auth for", publicKey.toBase58());
        const challengeRes = await fetch("/api/magicblock/challenge", withNetworkHeaders({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: publicKey.toBase58() })
        }, network));
        const challengeData = await challengeRes.json();
        console.log("[pay-flow] challenge response", challengeRes.status, challengeData);
        if (challengeRes.ok && challengeData.challenge) {
          const msgBytes = new TextEncoder().encode(challengeData.challenge);
          const sig = await signMessage(msgBytes);
          const sigBase64 = Buffer.from(sig).toString("base64");
          const tokenRes = await fetch("/api/magicblock/auth-token", withNetworkHeaders({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: publicKey.toBase58(), challenge: challengeData.challenge, signature: sigBase64 })
          }, network));
          const tokenData = await tokenRes.json();
          console.log("[pay-flow] auth-token response", tokenRes.status, tokenData);
          if (tokenRes.ok && tokenData.token) {
            mbToken = tokenData.token;
            console.log("[pay-flow] auth token obtained ✓");
          } else {
            console.warn("[pay-flow] auth token missing — proceeding without token");
          }
        } else {
          console.warn("[pay-flow] challenge failed — proceeding without token");
        }
      } else {
        console.warn("[pay-flow] signMessage not available — skipping auth");
      }

      setState({ loading: true, step: "Building…", mode: "magicblock" });
      const txResponse = await fetch(`/api/payment-intents/${intentData.id}/build-magicblock-transfer`, withNetworkHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payerWallet: publicKey.toBase58(), token: mbToken })
      }, network));
      const txData = await txResponse.json();
      console.log("[pay-flow] build response", txResponse.status, txData);
      if (!txResponse.ok) throw new Error(extractApiError(txData, "Build failed."));

      const unsignedTx = deserializeMagicBlockTransaction(txData.transactionBase64) as Transaction | VersionedTransaction;
      const signedTx = await signTransaction(unsignedTx);
      setState({ loading: true, step: "Sending…", mode: "magicblock" });
      const rpcUrl = txData.rpcUrl ?? resolveMagicBlockRpc(txData, network, mbToken);
      const mbConnection = new Connection(rpcUrl, "confirmed");
      const signature = await mbConnection.sendRawTransaction(signedTx.serialize());
      const latestBlockhash = await mbConnection.getLatestBlockhash();
      await mbConnection.confirmTransaction({ signature, ...latestBlockhash }, "confirmed");

      setState({ loading: true, step: "Confirming…", mode: "magicblock" });
      const confirmResponse = await fetch(`/api/payment-intents/${intentData.id}/confirm`, withNetworkHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature })
      }, network));
      const confirmData = await confirmResponse.json();
      if (!confirmResponse.ok) throw new Error(extractApiError(confirmData, "Confirm failed."));
      setState({ loading: false, success: true, mode: "magicblock" });
      window.location.href = `/receipt/${confirmData.receipt.receiptCode}`;
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Payment failed.", mode: "magicblock" });
    }
  };

  const payPrivately = async () => {
    if (!connected) { setVisible(true); return; }
    if (!umbraSupport.supported) { setState({ loading: false, error: "Use a compatible wallet." }); return; }
    try {
      await ensureSufficientBalance();
      setState({ loading: true, step: "Creating intent…", mode: "umbra" });
      const intentResponse = await fetch("/api/payment-intents", withNetworkHeaders({
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentLinkId: link.id, payerWallet: publicKey?.toBase58(), amount: String(link.amount), tokenType: link.tokenType, tokenMint: link.tokenMint })
      }, network));
      const intentData = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(extractApiError(intentData, "Intent failed."));
      const privateResult = await createPrivatePayment(wallet, { network, receiverAddress: link.receiverWallet, mint: link.tokenMint ?? "", amount: link.amount }, (step) => setState({ loading: true, step, mode: "umbra" }));
      const signature = privateResult.createUtxoSignature as string | undefined;
      if (!signature) throw new Error("No signature returned.");
      setState({ loading: true, step: "Confirming…", mode: "umbra" });
      const confirmResponse = await fetch(`/api/payment-intents/${intentData.id}/confirm`, withNetworkHeaders({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signature, umbraUtxoCommitment: signature }) }, network));
      const confirmData = await confirmResponse.json();
      if (!confirmResponse.ok) throw new Error(extractApiError(confirmData, "Confirm failed."));
      setState({ loading: false, success: true, mode: "umbra" });
      window.location.href = `/receipt/${confirmData.receipt.receiptCode}`;
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Payment failed.", mode: "umbra" });
    }
  };

  const pay = async () => {
    if (!publicKey || !signTransaction) {
      if (!connected) setVisible(true);
      setState({ loading: false, error: "Connect wallet." });
      return;
    }
    try {
      setState({ loading: true, step: "Creating…", mode: "public" });
      const intentResponse = await fetch("/api/payment-intents", withNetworkHeaders({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentLinkId: link.id, payerWallet: publicKey.toBase58(), amount: String(link.amount), tokenType: link.tokenType, tokenMint: link.tokenMint }) }, network));
      const intentData = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(extractApiError(intentData, "Intent failed."));
      setState({ loading: true, step: "Building…", mode: "public" });
      const txResponse = await fetch(`/api/payment-intents/${intentData.id}/build-transaction`, withNetworkHeaders({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payerWallet: publicKey.toBase58() }) }, network));
      const txData = await txResponse.json();
      if (!txResponse.ok) throw new Error(extractApiError(txData, "Build failed."));
      const transaction = Transaction.from(Buffer.from(txData.serializedTransaction, "base64"));
      const signed = await signTransaction(transaction);
      setState({ loading: true, step: "Sending…", mode: "public" });
      const signature = await connection.sendRawTransaction(signed.serialize());
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature, ...latestBlockhash }, "confirmed");
      setState({ loading: true, step: "Confirming…", mode: "public" });
      const confirmResponse = await fetch(`/api/payment-intents/${intentData.id}/confirm`, withNetworkHeaders({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signature }) }, network));
      const confirmData = await confirmResponse.json();
      if (!confirmResponse.ok) throw new Error(extractApiError(confirmData, "Confirm failed."));
      setState({ loading: false, success: true, mode: "public" });
      window.location.href = `/receipt/${confirmData.receipt.receiptCode}`;
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Payment failed.", mode: "public" });
    }
  };

  const handlePay = () => {
    if (rail === "magicblock") return payMagicBlock();
    if (rail === "umbra" && canPayPrivately) return payPrivately();
    return pay();
  };

  const isPrivate = rail === "magicblock" || (rail === "umbra" && canPayPrivately);

  // Success state
  if (state.success) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="icon-circle-lg animate-scale-in text-success">
            <CheckCircle className="h-7 w-7" weight="fill" />
          </div>
          <p className="text-lg font-semibold text-foreground">Sent</p>
          <p className="text-sm text-muted-foreground">Redirecting…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center gap-6 py-10">
        {/* Status dot */}
        <StatusDot status={link.isExpired ? "expired" : link.status} />

        {/* Creator */}
        <p className="text-sm font-medium text-muted-foreground">{link.displayName}</p>

        {/* Amount — hero */}
        <div className="flex items-end gap-2">
          <span className="text-6xl font-bold tracking-tight text-foreground md:text-7xl">{link.amount}</span>
          <span className="mono-address pb-2 text-sm uppercase tracking-wider text-muted-foreground">{link.tokenSymbol}</span>
        </div>

        {/* Privacy indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isPrivate ? <Lock className="h-3.5 w-3.5 text-accent" /> : <LockOpen className="h-3.5 w-3.5" />}
          {isPrivate ? "Private" : "Public"}
        </div>

        {/* Wallet balance */}
        {connected && (
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Your balance:</span>
            {walletBalance.loading ? (
              <span className="h-3 w-12 animate-pulse rounded bg-muted-foreground/20" />
            ) : walletBalance.value !== null ? (
              <span className="font-semibold tabular-nums text-foreground">
                {walletBalance.value.toLocaleString(undefined, { maximumFractionDigits: link.tokenType === "SOL" ? 6 : 2 })}{" "}
                <span className="font-normal text-muted-foreground">{link.tokenSymbol}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
            <span className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {network}
            </span>
          </div>
        )}

        {/* Error */}
        {solDisabled ? (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            <WarningCircle className="h-4 w-4" aria-hidden />
            SOL payments are disabled. Please create and use USDC links only.
          </div>
        ) : rail === "umbra" && connected && !umbraSupport.supported ? (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            <WarningCircle className="h-4 w-4" aria-hidden />
            {umbraSupport.reason ?? "Your wallet does not support Umbra private payments. Try Phantom or Solflare."}
          </div>
        ) : state.error ? (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            <WarningCircle className="h-4 w-4" aria-hidden />
            {state.error}
          </div>
        ) : null}

        {/* Loading */}
        {state.loading && state.step ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            {state.step}
          </div>
        ) : null}

        {/* CTA */}
        {!state.success && !state.loading ? (
          <Button
            onClick={!connected ? () => setVisible(true) : handlePay}
            disabled={!canPay || (rail === "umbra" && !isSolPayment && connected && !umbraSupport.supported)}
            className="w-full max-w-xs"
            size="lg"
          >
            {solDisabled
              ? "Unavailable"
              : !connected
                ? "Connect wallet"
                : link.isExpired
                  ? "Expired"
                  : `Pay ${formatAmount(link.amount, link.tokenSymbol)}`}
          </Button>
        ) : null}

        {/* QR toggle — only for public rail on non-private links */}
        {rail !== "magicblock" && !isPrivate && link.privacyMode !== "umbra_utxo" && !state.loading ? <SolanaPayQr slug={link.slug} /> : null}
      </CardContent>
    </Card>
  );
}
