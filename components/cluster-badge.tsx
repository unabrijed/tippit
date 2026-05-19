"use client";

import { useNetwork } from "@/components/network-provider";

export function ClusterBadge() {
  const { config } = useNetwork();
  const isMainnet = config.id === "mainnet";

  return (
    <div
      className={`hidden min-h-11 items-center rounded-full border px-3 text-xs font-medium uppercase tracking-[0.18em] md:inline-flex ${
        isMainnet
          ? "border-ghost-mist/60 bg-ghost-cream/60 text-ghost-smoke dark:bg-white/5 dark:text-[#D4CEC6]"
          : "border-ghost-gold/40 bg-ghost-gold/10 text-[#8A6A30]"
      }`}
    >
      {config.label}
    </div>
  );
}
