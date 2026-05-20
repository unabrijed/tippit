"use client";

import { useNetwork } from "@/components/network-provider";

export function NetworkSwitcher() {
  const { network, setNetwork } = useNetwork();

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-white p-0.5">
      {[
        { id: "mainnet", color: "bg-emerald-500" },
        { id: "devnet", color: "bg-amber-400" }
      ].map((option) => {
        const active = option.id === network;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setNetwork(option.id as typeof network)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active ? "bg-foreground text-white" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={active}
            title={option.id}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : option.color}`} />
            <span className="hidden sm:inline">{option.id === "mainnet" ? "Main" : "Dev"}</span>
          </button>
        );
      })}
    </div>
  );
}
