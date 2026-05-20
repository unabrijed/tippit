"use client";

import { NetworkProvider } from "@/components/network-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <NetworkProvider>{children}</NetworkProvider>;
}
