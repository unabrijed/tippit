"use client";

import { useMemo, useState } from "react";
import { CheckCircle, ChatCircle, Eye, EyeSlash, Ghost, WarningCircle } from "@phosphor-icons/react";
import { Connection, SendTransactionError, type Transaction, type VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { CreatorProfileRecord, TipVisibility } from "@/lib/tippit/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNetwork } from "@/components/network-provider";
import { createPrivatePayment } from "@/lib/umbra/browser";
import { getUmbraWalletSupport } from "@/lib/umbra/wallet";
import { withNetworkHeaders } from "@/lib/network-request";
import { deserializeMagicBlockTransaction } from "@/lib/magicblock/tx";

const PRESETS = [1, 5, 10, 25];

type State = { loading: boolean; step?: string; error?: string; success?: boolean };

function toBaseUnits(amountUi: number) {
  return String(Math.round(amountUi * 1_000_000));
}

export function TipCheckout({ creator }: { creator: CreatorProfileRecord }) {
  const { publicKey, connected, signTransaction, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { network } = useNetwork();
  const [amountUi, setAmountUi] = useState<number>(5);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [visibility, setVisibility] = useState<TipVisibility>("creator_only");
  const [state, setState] = useState<State>({ loading: false });
  const isUmbra = creator.defaultRail === "umbra";
  const umbraSupport = getUmbraWalletSupport(wallet);

  const pay = async () => {
    if (!publicKey || (!isUmbra && !signTransaction)) {
      setVisible(true);
      return;
    }

    try {
      if (isUmbra && !umbraSupport.supported) throw new Error("Use a compatible wallet.");

      setState({ loading: true, step: "Creating…" });
      const intentResponse = await fetch("/api/tips/create", withNetworkHeaders({
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorSlug: creator.slug, amount: toBaseUnits(amountUi), amountUi, message, visibility, fanWalletAddress: publicKey.toBase58() })
      }, network));
      const intent = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(intent.error || "Intent failed.");

      let signature = "";

      if (isUmbra) {
        const result = await createPrivatePayment(wallet, { receiverAddress: creator.walletAddress, mint: intent.mint, amount: amountUi, network }, (step) => setState({ loading: true, step }));
        signature = result.createUtxoSignature as string | undefined || "";
        if (!signature) throw new Error("No signature.");
      } else {
        if (!signTransaction) throw new Error("Wallet cannot sign.");
        setState({ loading: true, step: "Building…" });
        const txResponse = await fetch("/api/tips/build-magicblock-transfer", withNetworkHeaders({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientRefId: intent.clientRefId, fanWallet: publicKey.toBase58() }) }, network));
        const txData = await txResponse.json();
        if (!txResponse.ok) throw new Error(txData.error || "Build failed.");
        const unsignedTx = deserializeMagicBlockTransaction(txData.transactionBase64) as Transaction | VersionedTransaction;
        const signedTx = await signTransaction(unsignedTx);
        setState({ loading: true, step: "Sending…" });
        const connection = new Connection(txData.rpcUrl, "confirmed");
        signature = await connection.sendRawTransaction(signedTx.serialize());
        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({ signature, ...latestBlockhash }, "confirmed");
      }

      setState({ loading: true, step: "Confirming…" });
      const confirmResponse = await fetch("/api/tips/confirm", withNetworkHeaders({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientRefId: intent.clientRefId, txSignature: signature }) }, network));
      const confirmData = await confirmResponse.json();
      if (!confirmResponse.ok) throw new Error(confirmData.error || "Confirm failed.");

      setState({ loading: false, success: true });
      setMessage("");
    } catch (value) {
      const error = value instanceof SendTransactionError ? value.message : value instanceof Error ? value.message : "Failed.";
      setState({ loading: false, error });
    }
  };

  // Success
  if (state.success) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="icon-circle-lg animate-scale-in text-success">
            <CheckCircle className="h-7 w-7" weight="fill" />
          </div>
          <p className="text-lg font-semibold text-foreground">Sent!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 py-8">
        {/* Amount presets */}
        <div className="flex justify-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmountUi(preset)}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold transition ${
                amountUi === preset
                  ? "bg-accent text-white shadow-glow"
                  : "border border-border bg-white text-foreground hover:border-accent/30"
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex items-center justify-center gap-1">
          <span className="text-2xl font-semibold text-muted-foreground">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={String(amountUi)}
            onChange={(e) => setAmountUi(Number(e.target.value || 0))}
            className="w-20 bg-transparent text-center text-3xl font-bold tracking-tight text-foreground outline-none"
            aria-label="Custom amount"
          />
        </div>

        {/* Visibility — icon-only */}
        <div className="flex justify-center gap-2">
          {([
            { value: "creator_only", icon: Eye, title: "Creator only" },
            { value: "public", icon: EyeSlash, title: "Public" },
            { value: "anonymous", icon: Ghost, title: "Anonymous" }
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setVisibility(option.value)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                visibility === option.value
                  ? "bg-accent text-white"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
              title={option.title}
            >
              <option.icon className="h-4 w-4" weight={visibility === option.value ? "fill" : "regular"} />
            </button>
          ))}
        </div>

        {/* Message toggle */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowMessage(!showMessage)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition ${
              showMessage ? "bg-accent-soft text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ChatCircle className="h-3.5 w-3.5" />
            {showMessage ? "Hide message" : "Add message"}
          </button>
        </div>

        {showMessage ? (
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something…"
            maxLength={240}
            className="resize-none"
          />
        ) : null}

        {/* Error */}
        {state.error ? (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            <WarningCircle className="h-4 w-4" />
            {state.error}
          </div>
        ) : null}

        {/* Loading */}
        {state.loading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            {state.step}
          </div>
        ) : null}

        {/* CTA */}
        {!state.loading ? (
          <Button
            type="button"
            onClick={!connected ? () => setVisible(true) : pay}
            disabled={state.loading || !amountUi || (isUmbra && connected && !umbraSupport.supported)}
            className="w-full"
            size="lg"
          >
            {!connected ? "Connect wallet" : `Send $${amountUi}`}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
