"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Plus, ChartBar, ShieldChevron } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { ClusterBadge } from "@/components/cluster-badge";
import { NetworkSwitcher } from "@/components/network-switcher";

const WalletButtonShell = dynamic(() => import("@/components/wallet-button-shell").then((m) => m.WalletButtonShell), { ssr: false });

const nav = [
  { href: "/", label: "Home", icon: House },
  { href: "/create", label: "Create", icon: Plus },
  { href: "/dashboard", label: "Monitor", icon: ChartBar }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-full transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="icon-circle-sm">
              <ShieldChevron aria-hidden className="h-4 w-4" weight="duotone" />
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">Tippit</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border bg-white/80 p-1 md:flex">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active ? "bg-foreground text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon aria-hidden className="h-4 w-4" weight={active ? "fill" : "regular"} />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile nav */}
          <nav className="flex items-center gap-1 rounded-full border border-border bg-white/80 p-1 md:hidden">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
                    active ? "bg-foreground text-white" : "text-muted-foreground"
                  )}
                  aria-label={item.label}
                >
                  <Icon aria-hidden className="h-4 w-4" weight={active ? "fill" : "regular"} />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ClusterBadge />
            <NetworkSwitcher />
            <WalletButtonShell />
          </div>
        </div>
      </header>

      <div className="pb-12">{children}</div>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldChevron aria-hidden className="h-3.5 w-3.5" weight="duotone" />
            <span className="text-xs font-medium">Tippit</span>
          </div>
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
