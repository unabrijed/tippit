"use client";

import { useNetwork } from "@/components/network-provider";

export function NetworkSwitcher() {
  const { network, setNetwork } = useNetwork();

  return (
    <div className="inline-flex min-h-11 items-center rounded-full border border-border/70 bg-card/80 p-1">
      {[
        { id: "mainnet", label: "Mainnet" },
        { id: "devnet", label: "Devnet" }
      ].map((option) => {
        const active = option.id === network;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setNetwork(option.id as typeof network)}
            className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium uppercase tracking-[0.16em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              active
                ? "bg-ghost-pine text-ghost-ivory"
                : "text-ghost-smoke hover:bg-ghost-pine/5 hover:text-ghost-pine dark:hover:bg-ghost-ivory/10 dark:hover:text-ghost-ivory"
            }`}
            aria-pressed={active}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
