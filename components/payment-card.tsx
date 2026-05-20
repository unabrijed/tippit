"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Check, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import type { PaymentLinkRecord } from "@/lib/types";
import { StatusDot } from "@/components/brand-primitives";
import { formatAmount } from "@/lib/format";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

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
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 transition hover:shadow-card">
      {/* Status */}
      <StatusDot status={link.isExpired ? "expired" : link.status} />

      {/* Amount + label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {formatAmount(link.amount, link.tokenSymbol)}
          </span>
          {paymentCount > 0 ? (
            <span className="text-xs text-muted-foreground">×{paymentCount}</span>
          ) : null}
        </div>
        {link.displayName ? (
          <p className="truncate text-xs text-muted-foreground">{link.displayName}</p>
        ) : null}
      </div>

      {/* Time */}
      <span className="shrink-0 text-xs text-muted-foreground">
        {activityAt ? timeAgo(activityAt) : ""}
      </span>

      {/* Always-visible actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy link"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={copied ? "Copied!" : "Copy link"}
        >
          {copied ? <Check className="h-4 w-4 text-accent" weight="bold" /> : <Copy className="h-4 w-4" />}
        </button>
        <Link
          href={relativeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open link"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Open link"
        >
          <ArrowSquareOut className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
