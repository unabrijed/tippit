"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Check, Copy } from "@phosphor-icons/react";
import { useNetwork } from "@/components/network-provider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { withNetworkHeaders } from "@/lib/network-request";
import { getTokenConfig, type SupportedToken } from "@/lib/solana/tokens";

export function CreateLinkForm() {
  const { publicKey, connected } = useWallet();
  const { network, config } = useNetwork();
  const defaultUsdc = getTokenConfig("USDC", network);
  const defaultSol = getTokenConfig("SOL", network);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ url: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    title: "Untitled payment",
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
  }, [network]);

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
      setErrors({ wallet: "Connect a merchant wallet first." });
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
      setErrors(data.errors ?? { form: data.error ?? "Could not create payment link." });
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

  return (
    <Card className="bg-card/80">
      <CardContent className="p-6 md:p-8">
        <form className="space-y-6" onSubmit={submit}>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-ghost-smoke">Merchant wallet</p>
              <span className="inline-flex min-h-8 items-center rounded-full border border-border bg-background px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ghost-smoke">
                {config.label} · {config.cluster}
              </span>
            </div>
            <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-ghost-smoke">
              {connected && publicKey ? publicKey.toBase58() : "Connect a wallet to create a payment link."}
            </div>
            {errors.wallet ? <p className="text-xs text-destructive">{errors.wallet}</p> : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Merchant name" htmlFor="displayName" helper="Shown instead of a raw wallet by default.">
              <Input id="displayName" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} placeholder="Shoonya Studio" autoComplete="organization" />
            </Field>
            <Field label="Title" htmlFor="title" helper="What the payer is paying for.">
              <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Design assignment" autoComplete="off" aria-invalid={errors.title ? "true" : undefined} aria-describedby={errors.title ? "title-error" : undefined} />
              {errors.title ? <p id="title-error" className="text-xs text-destructive">{errors.title}</p> : null}
            </Field>
            <Field label="Payment token" htmlFor="tokenType" helper="Default is 1 USDC or 0.001 SOL.">
              <Select id="tokenType" value={form.tokenType} onChange={(e) => updateTokenType(e.target.value as SupportedToken)}>
                <option value="USDC">USDC</option>
                <option value="SOL">SOL</option>
              </Select>
            </Field>
            <Field label="Amount" htmlFor="amount" helper={form.tokenType === "USDC" ? "Defaults to 1 USDC." : "Defaults to 0.001 SOL."}>
              <Input id="amount" type="text" inputMode="decimal" value={form.amount} onChange={(e) => update("amount", e.target.value)} placeholder={form.tokenType === "USDC" ? "1" : "0.001"} aria-invalid={errors.amount ? "true" : undefined} aria-describedby={errors.amount ? "amount-error" : undefined} />
              {errors.amount ? <p id="amount-error" className="text-xs text-destructive">{errors.amount}</p> : null}
            </Field>
            <Field label="Expiry" htmlFor="expiresAt" helper="After expiry, the link will reject new payments.">
              <Input id="expiresAt" type="datetime-local" value={form.expiresAt} onChange={(e) => update("expiresAt", e.target.value)} />
            </Field>
            <Field label="Link type" htmlFor="linkType" helper="One-time is recommended for invoices.">
              <Select id="linkType" value={form.linkType} onChange={(e) => update("linkType", e.target.value)}>
                <option value="one_time">One-time</option>
                <option value="reusable">Reusable</option>
              </Select>
            </Field>
            <Field label="USDC mint" htmlFor="tokenMint" helper={form.tokenType === "USDC" ? `${config.label} USDC by default. Override if your mint differs.` : "Not needed for native SOL payments."}>
              <Input id="tokenMint" value={form.tokenMint} onChange={(e) => update("tokenMint", e.target.value)} spellCheck={false} className="mono-address" disabled={form.tokenType === "SOL"} />
            </Field>
          </div>

          <div className="rounded-md border border-ghost-pine/20 bg-ghost-pine/5 px-4 py-3 text-sm text-ghost-smoke dark:text-[#D4CEC6]">
            {form.tokenType === "USDC"
              ? "USDC links are Umbra-private by default and do not allow a public transfer fallback."
              : "SOL links use the public transfer path. Umbra private payments are currently enabled for USDC links."}
          </div>

          <Field label="Description" htmlFor="description" helper="Optional public context for the payer.">
            <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Private bounty payout for the final design sprint." />
          </Field>

          {errors.form ? <p className="text-sm text-destructive">{errors.form}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? "Creating link…" : `Create ${config.label.toLowerCase()} ${form.tokenType} link`}
            </Button>
            <p className="text-sm text-ghost-smoke dark:text-[#C9C1B8]">GhostPay stores metadata only. Funds move wallet-to-wallet on Solana.</p>
          </div>
        </form>

        {result ? (
          <div className="mt-6 rounded-lg border border-ghost-pine/20 bg-ghost-pine/5 p-4 text-sm text-ghost-pine dark:bg-ghost-ivory/10 dark:text-ghost-ivory">
            <p className="font-medium">Payment link created on {config.label}.</p>
            <div className="mt-2 flex items-center gap-2">
              <input readOnly value={result.url} onFocus={(e) => e.target.select()} className="mono-address w-full flex-1 rounded-md border border-ghost-pine/20 bg-background px-3 py-2 text-xs text-ghost-ink dark:text-ghost-ivory" />
              <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(result.url); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch {} }} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-ghost-pine/20 px-3 text-xs font-medium transition hover:bg-ghost-pine/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <a href={result.url} className="mt-2 inline-block text-xs underline-offset-4 hover:underline">Open link</a>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Field({ label, htmlFor, helper, children }: { label: string; htmlFor: string; helper: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ghost-ink dark:text-ghost-ivory">{label}</label>
      {children}
      <p className="text-xs text-ghost-smoke dark:text-[#C9C1B8]">{helper}</p>
    </div>
  );
}
