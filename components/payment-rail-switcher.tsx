"use client";

import { usePaymentRail } from "@/components/payment-rail-provider";
import type { TippitRail } from "@/lib/tippit/types";

const RAILS: { value: TippitRail; label: string; description: string }[] = [
  {
    value: "magicblock",
    label: "MagicBlock",
    description: "Private ephemeral rollup. Gasless & fast."
  },
  {
    value: "umbra",
    label: "Umbra",
    description: "UTXO-based on-chain privacy."
  }
];

/**
 * A compact pill-style switcher that updates the global PaymentRailContext.
 * Renders nothing when only one rail is allowed.
 */
export function PaymentRailSwitcher({ className }: { className?: string }) {
  const { rail, setRail } = usePaymentRail();

  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-border bg-white p-1 self-start text-sm ${className ?? ""}`}
      role="radiogroup"
      aria-label="Payment protocol"
    >
      {RAILS.map((r) => (
        <button
          key={r.value}
          type="button"
          role="radio"
          aria-checked={rail === r.value}
          onClick={() => setRail(r.value)}
          title={r.description}
          className={`inline-flex min-h-8 items-center rounded-full px-4 text-sm font-medium transition ${
            rail === r.value
              ? "bg-foreground text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
