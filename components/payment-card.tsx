"use client";

import Link from "next/link";
import { useState } from "react";
import { Coins, Copy, QrCode, Receipt, ArrowSquareOut, Check } from "@phosphor-icons/react/dist/ssr";
import type { PaymentLinkRecord } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/status-pill";
import { formatAmount, formatDateTime } from "@/lib/format";

export function PaymentCard({
  link,
  paymentCount = 0,
  lastPaidAt,
  activityAt
}: {
  link: PaymentLinkRecord;
  paymentCount?: number;
  lastPaidAt?: string;
  activityAt?: string;
}) {
  const [copied, setCopied] = useState(false);
  const relativeUrl = `/pay/${link.slug}`;

  const handleCopy = async () => {
    try {
      const fullUrl = `${window.location.origin}${relativeUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Card className="bg-card/80">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-ghost-smoke">{link.displayName}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-ghost-ink dark:text-ghost-ivory">{link.title}</h3>
              <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-ghost-pine/20 bg-ghost-pine/5 px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ghost-pine dark:bg-ghost-ivory/10 dark:text-ghost-ivory">
                <Coins aria-hidden className="h-3.5 w-3.5" />
                {link.tokenSymbol}
              </span>
            </div>
            <p className="text-sm text-ghost-smoke dark:text-[#C9C1B8]">{formatAmount(link.amount, link.tokenSymbol)} · Expires {formatDateTime(link.expiresAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill status={link.status === "active" ? "active" : link.status}>{link.status}</StatusPill>
            <span className="inline-flex min-h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium uppercase tracking-[0.18em] text-ghost-smoke">
              {link.network}
            </span>
            {link.linkType === "reusable" ? (
              <span className="inline-flex min-h-8 items-center rounded-md border border-ghost-gold/40 bg-ghost-gold/15 px-3 text-xs font-medium uppercase tracking-[0.18em] text-[#8A6A30]">
                Recurring
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid gap-3 rounded-lg border border-border bg-background/60 p-4 text-sm text-ghost-smoke dark:text-[#C9C1B8] md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em]">Last paid</p>
            <p className="font-medium text-ghost-ink dark:text-ghost-ivory">{lastPaidAt ? formatDateTime(lastPaidAt) : "Unpaid"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em]">Payments</p>
            <p className="font-medium text-ghost-ink dark:text-ghost-ivory">{paymentCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em]">Activity</p>
            <p className="font-medium text-ghost-ink dark:text-ghost-ivory">{activityAt ? formatDateTime(activityAt) : formatDateTime(link.updatedAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={relativeUrl} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-ghost-smoke transition hover:bg-ghost-pine/5 hover:text-ghost-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <ArrowSquareOut aria-hidden className="h-4 w-4" />
            Open link
          </Link>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-ghost-smoke transition hover:bg-ghost-pine/5 hover:text-ghost-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Copy link"
          >
            {copied ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-ghost-smoke transition hover:bg-ghost-pine/5 hover:text-ghost-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Show QR code">
            <QrCode aria-hidden className="h-4 w-4" />
            QR
          </button>
          <Link href="/receipt/demo-gp-82kx" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-ghost-smoke transition hover:bg-ghost-pine/5 hover:text-ghost-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Receipt aria-hidden className="h-4 w-4" />
            Receipt sample
          </Link>
        </div>
        <p className="mono-address break-all text-xs text-ghost-smoke dark:text-[#C9C1B8]">{relativeUrl}</p>
      </CardContent>
    </Card>
  );
}
