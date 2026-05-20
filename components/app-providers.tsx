"use client";

import { NetworkProvider } from "@/components/network-provider";
import { PaymentRailProvider } from "@/components/payment-rail-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <NetworkProvider>
      <PaymentRailProvider defaultRail="magicblock">{children}</PaymentRailProvider>
    </NetworkProvider>
  );
}
