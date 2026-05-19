"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Ghost, CurrencyCircleDollar } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { ClusterBadge } from "@/components/cluster-badge";
import { NetworkSwitcher } from "@/components/network-switcher";

const WalletButtonShell = dynamic(() => import("@/components/wallet-button-shell").then((m) => m.WalletButtonShell), { ssr: false });

const nav = [
  { href: "/", label: "Home" },
  { href: "/create", label: "Create" },
  { href: "/dashboard", label: "Dashboard" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-[88px] w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-3 rounded-md px-1 text-ghost-ink transition hover:text-ghost-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:text-ghost-ivory"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ghost-pine/20 bg-ghost-pine/10 text-ghost-pine dark:border-ghost-ivory/20 dark:bg-ghost-ivory/10 dark:text-ghost-ivory">
              <Ghost aria-hidden className="h-5 w-5" weight="duotone" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-2xl leading-none">GhostPay</span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-ghost-smoke">Private payment links</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1 md:flex">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? "bg-ghost-pine text-ghost-ivory"
                      : "text-ghost-smoke hover:bg-ghost-pine/5 hover:text-ghost-pine dark:hover:bg-ghost-ivory/10 dark:hover:text-ghost-ivory"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ClusterBadge />
            <NetworkSwitcher />
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-card text-ghost-smoke transition hover:text-ghost-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
            </button>
            <WalletButtonShell />
          </div>
        </div>
      </header>
      <div className="pb-16">{children}</div>
      <footer className="border-t border-border/70 bg-background/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-ghost-smoke md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <CurrencyCircleDollar aria-hidden className="h-4 w-4" />
            <span>Public USDC transfer path live now. Private Umbra execution slots in next.</span>
          </div>
          <span className="text-xs uppercase tracking-[0.18em]">Get paid without getting watched.</span>
        </div>
      </footer>
    </div>
  );
}
