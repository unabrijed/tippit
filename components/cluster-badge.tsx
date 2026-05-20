"use client";

import { useNetwork } from "@/components/network-provider";

export function ClusterBadge() {
  const { config } = useNetwork();
  const isMainnet = config.id === "mainnet";

  return (
    <div
      className={`hidden min-h-11 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.2em] md:inline-flex ${
        isMainnet
          ? "border-slate-200 bg-white/80 text-slate-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {config.label}
    </div>
  );
}
