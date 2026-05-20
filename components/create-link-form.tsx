"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Check, Copy, Lock, LockOpen, Wallet } from "@phosphor-icons/react";
import { useNetwork } from "@/components/network-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { withNetworkHeaders } from "@/lib/network-request";
import { getTokenConfig, type SupportedToken } from "@/lib/solana/tokens";

export function CreateLinkForm() {
  const { publicKey, connected } = useWallet();
  const { network } = useNetwork();
  const defaultUsdc = getTokenConfig("USDC", network);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ url: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    title: "Private support",
    description: "",
    amount: String(defaultUsdc.defaultAmount),
    tokenType: "USDC" as SupportedToken,
    tokenMint: defaultUsdc.mint ?? "",
    privacyMode: "umbra_utxo" as "umbra_utxo" | "public_transfer",
    linkType: "one_time",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    displayName: ""
  });

  useEffect(() => {
    const active = getTokenConfig(form.tokenType, network);
    setForm((current) => ({
      ...current,
      amount: String(active.defaultAmount),
      tokenMint: active.mint ?? ""
    }));
  }, [network, form.tokenType]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const updateTokenType = (tokenType: SupportedToken) => {
    const token = getTokenConfig(tokenType, network);
    setForm((current) => ({
      ...current,
      tokenType,
      amount: String(token.defaultAmount),
      tokenMint: token.mint ?? "",
      privacyMode: tokenType === "USDC" ? "umbra_utxo" : "public_transfer"
    }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) {
      setErrors({ wallet: "Connect wallet first." });
      return;
    }

    setSubmitting(true);
    setErrors({});

    await fetch(
      "/api/merchants",
      withNetworkHeaders(
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: publicKey.toBase58(), displayName: form.displayName || undefined })
        },
        network
      )
    );

    const response = await fetch(
      "/api/payment-links",
      withNetworkHeaders(
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description || undefined,
            amount: form.amount,
            tokenType: form.tokenType,
            tokenMint: form.tokenType === "USDC" ? form.tokenMint : undefined,
            privacyMode: form.privacyMode,
            linkType: form.linkType,
            expiresAt: new Date(form.expiresAt).toISOString(),
            displayName: form.displayName || undefined,
            receiverWallet: publicKey.toBase58()
          })
        },
        network
      )
    );

    const data = await response.json();
    if (!response.ok) {
      setErrors(data.errors ?? { form: data.error ?? "Could not create link." });
      setSubmitting(false);
      return;
    }

    setResult({ id: data.id, url: data.url });
    setSubmitting(false);
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Success state
  if (result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-12">
          <div className="icon-circle-lg animate-scale-in text-success">
            <Check className="h-7 w-7" weight="bold" />
          </div>
          <p className="text-lg font-semibold text-foreground">Link created</p>
          <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-muted/50 p-2">
            <input readOnly value={result.url} onFocus={(e) => e.target.select()} className="mono-address flex-1 bg-transparent px-2 text-xs text-foreground outline-none" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result.url);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                } catch {}
              }}
            >
              {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <a href={result.url} className="text-sm font-medium text-accent hover:underline">Open link →</a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-6 py-8">
        {/* Wallet indicator */}
        <div className="flex items-center gap-2">
          {connected && publicKey ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="mono-address text-xs text-muted-foreground">{publicKey.toBase58().slice(0, 8)}…</span>
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Connect wallet</span>
            </>
          )}
          {errors.wallet ? <span className="text-xs text-destructive">{errors.wallet}</span> : null}
        </div>

        <form className="space-y-5" onSubmit={submit}>
          {/* Amount — hero-sized */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex items-end gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                className="w-32 bg-transparent text-center text-5xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
                placeholder="0"
                aria-label="Amount"
              />
              {/* Token toggle */}
              <div className="flex items-center gap-1 pb-2">
                {(["USDC", "SOL"] as SupportedToken[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateTokenType(t)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                      form.tokenType === t
                        ? "bg-foreground text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {errors.amount ? <p className="text-xs text-destructive">{errors.amount}</p> : null}
          </div>

          {/* Name */}
          <Input
            value={form.displayName}
            onChange={(e) => update("displayName", e.target.value)}
            placeholder="Your name"
            autoComplete="organization"
          />

          {/* Row: Privacy toggle + Type toggle + Expiry */}
          <div className="flex items-center gap-3">
            {/* Privacy */}
            {form.tokenType === "USDC" ? (
              <button
                type="button"
                onClick={() => update("privacyMode", form.privacyMode === "umbra_utxo" ? "public_transfer" : "umbra_utxo")}
                className={`inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-medium transition ${
                  form.privacyMode === "umbra_utxo"
                    ? "border-accent/20 bg-accent-soft text-accent"
                    : "border-border bg-white text-muted-foreground"
                }`}
                title={form.privacyMode === "umbra_utxo" ? "Private route" : "Public route"}
              >
                {form.privacyMode === "umbra_utxo" ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                {form.privacyMode === "umbra_utxo" ? "Private" : "Public"}
              </button>
            ) : null}

            {/* Type */}
            <button
              type="button"
              onClick={() => update("linkType", form.linkType === "one_time" ? "reusable" : "one_time")}
              className={`inline-flex h-10 items-center rounded-full border px-3 text-xs font-medium transition ${
                form.linkType === "reusable"
                  ? "border-accent/20 bg-accent-soft text-accent"
                  : "border-border bg-white text-muted-foreground"
              }`}
            >
              {form.linkType === "reusable" ? "Reusable" : "One-time"}
            </button>

            {/* Expiry — compact */}
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => update("expiresAt", e.target.value)}
              className="h-10 flex-1 rounded-full border border-border bg-white px-3 text-xs text-muted-foreground outline-none focus-visible:border-accent/40"
            />
          </div>

          {errors.form ? <p className="text-sm text-destructive">{errors.form}</p> : null}

          <Button type="submit" disabled={submitting} aria-busy={submitting} className="w-full">
            {submitting ? "Creating…" : "Create"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
