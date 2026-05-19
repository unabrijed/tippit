"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { NetworkProvider } from "@/components/network-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NetworkProvider>{children}</NetworkProvider>
    </ThemeProvider>
  );
}
