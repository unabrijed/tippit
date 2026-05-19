"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { CurrencyCircleDollar, Receipt, ShieldCheck } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import type { DashboardPayload } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { PaymentCard } from "@/components/payment-card";
import { Skeleton } from "@/components/skeleton";
import { AnimatedNumber } from "@/components/animated-number";
import { MotionSection, MotionStagger, MotionItem } from "@/components/motion";
import { useNetwork } from "@/components/network-provider";
import { withNetworkHeaders } from "@/lib/network-request";
import { SolanaWalletProvider } from "@/components/solana-wallet-provider";

const ClaimCard = dynamic(() => import("@/components/claim-card").then((m) => m.ClaimCard), { ssr: false });
const UmbraReadinessCard = dynamic(() => import("@/components/umbra-readiness-card").then((m) => m.UmbraReadinessCard), { ssr: false });

const successfulIntentStatuses = new Set(["claimable", "claimed"]);

export default function DashboardPage() {
  return (
    <SolanaWalletProvider>
      <DashboardPageContent />
    </SolanaWalletProvider>
  );
}

function DashboardPageContent() {
  const { publicKey, connected } = useWallet();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persistenceMode, setPersistenceMode] = useState<string | null>(null);
  const { config, network } = useNetwork();

  useEffect(() => {
    if (!publicKey) return;
    let active = true;
    setLoading(true);
    fetch(`/api/dashboard?wallet=${publicKey.toBase58()}`, withNetworkHeaders(undefined, network))
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Could not load dashboard.");
        if (active) {
          setData(payload);
          setPersistenceMode(payload.persistenceMode ?? null);
          setError(null);
        }
      })
      .catch((value) => {
        if (active) setError(value instanceof Error ? value.message : "Could not load dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [network, publicKey]);

  const dashboard = useMemo(() => {
    if (!data) {
      return {
        summary: [],
        activeUnpaidLinks: [],
        recurringLinks: [],
        paidLinks: [],
        allLinks: [],
        claimItems: []
      };
    }

    const linkCards = data.links.map((link) => {
      const relatedIntents = data.intents.filter((intent) => intent.paymentLinkId === link.id);
      const successfulIntents = relatedIntents.filter((intent) => successfulIntentStatuses.has(intent.status));
      const lastPaidAt = successfulIntents.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt;
      const latestIntentAt = relatedIntents.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt;
      const activityAt = [link.updatedAt, latestIntentAt, lastPaidAt].filter(Boolean).sort().at(-1) ?? link.updatedAt;
      const isUnpaid = link.status === "active" && !lastPaidAt;

      return {
        link,
        paymentCount: successfulIntents.length,
        lastPaidAt,
        activityAt,
        isUnpaid,
        isRecurring: link.linkType === "reusable"
      };
    }).sort((a, b) => b.activityAt.localeCompare(a.activityAt));

    const paidLinks = linkCards.filter((item) => Boolean(item.lastPaidAt));
    const lastPaid = paidLinks[0];

    return {
      summary: [
        { label: "Active unpaid", value: linkCards.filter((item) => item.isUnpaid).length, icon: CurrencyCircleDollar },
        { label: "Recurring", value: linkCards.filter((item) => item.isRecurring).length, icon: Receipt },
        { label: "Claimable", value: data.intents.filter((item) => item.status === "claimable").length, icon: ShieldCheck }
      ],
      activeUnpaidLinks: linkCards.filter((item) => item.isUnpaid),
      recurringLinks: linkCards.filter((item) => item.isRecurring),
      paidLinks,
      allLinks: linkCards,
      lastPaid,
      claimItems: data.intents
        .filter((item) => item.status === "claimable" || item.status === "claimed")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    };
  }, [data]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-6 lg:px-8 lg:py-16">
      <MotionSection className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-ghost-smoke">Merchant dashboard</p>
        <h1 className="font-display text-5xl leading-none text-ghost-ink dark:text-ghost-ivory">Track payments. Maintain clarity.</h1>
        <p className="max-w-2xl text-sm leading-6 text-ghost-smoke dark:text-[#C9C1B8]">Active links, paid states, claimable receipts — one view.</p>
        {persistenceMode ? <p className="text-xs uppercase tracking-[0.18em] text-ghost-smoke dark:text-[#C9C1B8]">Network · {config.label} · Persistence · {persistenceMode}</p> : null}
      </MotionSection>

      {!connected || !publicKey ? (
        <EmptyState title="Connect a merchant wallet" copy="Your dashboard filters links and claimable payments by the connected receiver wallet." href="/create" cta="Create a payment link" />
      ) : null}

      {connected && publicKey ? (
        <>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Could not load dashboard. Try refreshing in a moment.
            </div>
          ) : null}

          <UmbraReadinessCard />

          {data ? (
            <>
              <MotionStagger className="grid gap-4 md:grid-cols-3" staggerDelay={0.08}>
                {dashboard.summary.map(({ label, value, icon: Icon }) => (
                  <MotionItem key={label}>
                    <div className="rounded-lg border border-border bg-card/80 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-ghost-smoke dark:text-[#C9C1B8]">{label}</p>
                        <Icon aria-hidden className="h-5 w-5 text-ghost-pine dark:text-ghost-ivory" />
                      </div>
                      <p className="mt-4 font-display text-5xl leading-none text-ghost-ink dark:text-ghost-ivory">
                        <AnimatedNumber value={value} />
                      </p>
                    </div>
                  </MotionItem>
                ))}
              </MotionStagger>

              <div className="rounded-lg border border-border bg-card/80 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-ghost-smoke dark:text-[#C9C1B8]">Last paid</p>
                    <p className="text-lg font-semibold text-ghost-ink dark:text-ghost-ivory">
                      {dashboard.lastPaid ? dashboard.lastPaid.link.title : "No paid links yet"}
                    </p>
                  </div>
                  <div className="text-sm text-ghost-smoke dark:text-[#C9C1B8]">
                    {dashboard.lastPaid?.lastPaidAt ? `Paid ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(dashboard.lastPaid.lastPaidAt))}` : "Your first successful payment will show here."}
                  </div>
                </div>
              </div>

              <section className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-ghost-ink dark:text-ghost-ivory">Active unpaid links</h2>
                  <p className="text-sm text-ghost-smoke dark:text-[#C9C1B8]">Open links that have not been paid yet.</p>
                </div>
                {dashboard.activeUnpaidLinks.length === 0 ? (
                  <EmptyState title="No active unpaid links" copy="When you create an active link that has not been paid yet, it will show here first." href="/create" cta="Create payment link" />
                ) : (
                  <div className="grid gap-4">{dashboard.activeUnpaidLinks.map((item) => <PaymentCard key={item.link.id} link={item.link} paymentCount={item.paymentCount} lastPaidAt={item.lastPaidAt} activityAt={item.activityAt} />)}</div>
                )}
              </section>

              <section className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-ghost-ink dark:text-ghost-ivory">Recurring links</h2>
                  <p className="text-sm text-ghost-smoke dark:text-[#C9C1B8]">Reusable links that can be paid more than once.</p>
                </div>
                {dashboard.recurringLinks.length === 0 ? (
                  <EmptyState title="No recurring links yet" copy="Create a reusable link to keep collecting repeat payments from one checkout URL." href="/create" cta="Create recurring link" />
                ) : (
                  <div className="grid gap-4">{dashboard.recurringLinks.map((item) => <PaymentCard key={item.link.id} link={item.link} paymentCount={item.paymentCount} lastPaidAt={item.lastPaidAt} activityAt={item.activityAt} />)}</div>
                )}
              </section>

              <section className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-ghost-ink dark:text-ghost-ivory">All links</h2>
                  <p className="text-sm text-ghost-smoke dark:text-[#C9C1B8]">Sorted by most recent activity.</p>
                </div>
                {dashboard.allLinks?.length === 0 ? (
                  <EmptyState title="No payment links yet" copy="Create your first GhostPay link to start receiving USDC with a better checkout experience." href="/create" cta="Create payment link" />
                ) : (
                  <div className="grid gap-4">
                    {dashboard.allLinks?.map((item) => (
                      <PaymentCard
                        key={item.link.id}
                        link={item.link}
                        paymentCount={item.paymentCount}
                        lastPaidAt={item.lastPaidAt}
                        activityAt={item.activityAt}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-ghost-ink dark:text-ghost-ivory">Claimable payments</h2>
                  <p className="text-sm text-ghost-smoke dark:text-[#C9C1B8]">Umbra receiver-claimable flow ready.</p>
                </div>
                {dashboard.claimItems.length === 0 ? (
                  <EmptyState title="No claimable payments yet" copy="Once a payer completes checkout, the payment will appear here for the merchant claim step." cta="Open a payment link" />
                ) : (
                  <div className="grid gap-4">
                    {dashboard.claimItems.map((intent) => <ClaimCard key={intent.id} intent={intent} />)}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
