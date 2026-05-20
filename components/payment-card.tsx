"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Check, DotsThree } from "@phosphor-icons/react/dist/ssr";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const relativeUrl = `/pay/${link.slug}`;

  const handleCopy = async () => {
    try {
      const fullUrl = `${window.location.origin}${relativeUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => { setCopied(false); setMenuOpen(false); }, 1500);
    } catch {}
  };

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border bg-white px-4 py-3 transition hover:shadow-card">
      {/* Status */}
      <StatusDot status={link.isExpired ? "expired" : link.status} />

      {/* Amount */}
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
      <span className="text-xs text-muted-foreground">
        {activityAt ? timeAgo(activityAt) : ""}
      </span>

      {/* Actions menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-muted"
          aria-label="Actions"
        >
          <DotsThree className="h-5 w-5" weight="bold" />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-full z-50 mt-1 w-36 animate-scale-in rounded-xl border border-border bg-white p-1 shadow-soft">
            <Link
              href={relativeUrl}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              Open
            </Link>
            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
