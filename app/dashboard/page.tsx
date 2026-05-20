"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { CurrencyCircleDollar, ShieldCheck, Link as LinkIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import type { DashboardPayload } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { PaymentCard } from "@/components/payment-card";
import { Skeleton } from "@/components/skeleton";
import { AnimatedNumber } from "@/components/animated-number";
import { MotionStagger, MotionItem } from "@/components/motion";
import { useNetwork } from "@/components/network-provider";
import { withNetworkHeaders } from "@/lib/network-request";
import { SolanaWalletProvider } from "@/components/solana-wallet-provider";
import { MetricTile } from "@/components/brand-primitives";

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
  const [tab, setTab] = useState<"links" | "claims">("links");
  const { network } = useNetwork();

  useEffect(() => {
    if (!publicKey) return;
    let active = true;
    setLoading(true);
    fetch(`/api/dashboard?wallet=${publicKey.toBase58()}`, withNetworkHeaders(undefined, network))
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Load failed.");
        if (active) { setData(payload); setError(null); }
      })
      .catch((value) => {
        if (active) setError(value instanceof Error ? value.message : "Load failed.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [network, publicKey]);

  const dashboard = useMemo(() => {
    if (!data) return { linkCards: [], claimItems: [], stats: { links: 0, claimable: 0, total: 0 } };

    const linkCards = data.links.map((link) => {
      const relatedIntents = data.intents.filter((intent) => intent.paymentLinkId === link.id);
      const successfulIntents = relatedIntents.filter((intent) => successfulIntentStatuses.has(intent.status));
      const lastPaidAt = successfulIntents.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt;
      const latestIntentAt = relatedIntents.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt;
      const activityAt = [link.updatedAt, latestIntentAt, lastPaidAt].filter(Boolean).sort().at(-1) ?? link.updatedAt;
      return { link, paymentCount: successfulIntents.length, lastPaidAt, activityAt };
    }).sort((a, b) => b.activityAt.localeCompare(a.activityAt));

    const claimItems = data.intents
      .filter((item) => item.status === "claimable" || item.status === "claimed")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      linkCards,
      claimItems,
      stats: {
        links: linkCards.length,
        claimable: data.intents.filter((i) => i.status === "claimable").length,
        total: data.intents.filter((i) => successfulIntentStatuses.has(i.status)).length,
      }
    };
  }, [data]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
      {!connected || !publicKey ? (
        <EmptyState title="Connect wallet" href="/create" cta="Create link" />
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
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Could not load data.
            </div>
          ) : null}

          <UmbraReadinessCard />

          {data ? (
            <>
              {/* Stats */}
              <MotionStagger className="grid gap-4 md:grid-cols-3" staggerDelay={0.06}>
                <MotionItem>
                  <MetricTile value={<AnimatedNumber value={dashboard.stats.links} />} icon={LinkIcon} />
                </MotionItem>
                <MotionItem>
                  <MetricTile value={<AnimatedNumber value={dashboard.stats.claimable} />} icon={ShieldCheck} />
                </MotionItem>
                <MotionItem>
                  <MetricTile value={<AnimatedNumber value={dashboard.stats.total} />} icon={CurrencyCircleDollar} />
                </MotionItem>
              </MotionStagger>

              {/* Tab toggle */}
              <div className="flex items-center gap-1 rounded-full border border-border bg-white p-1 self-start">
                {(["links", "claims"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`inline-flex min-h-8 items-center rounded-full px-4 text-sm font-medium transition ${
                      tab === t ? "bg-foreground text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "links" ? "Links" : "Claims"}
                  </button>
                ))}
              </div>

              {/* Content */}
              {tab === "links" ? (
                <section className="space-y-3">
                  {dashboard.linkCards.length === 0 ? (
                    <EmptyState title="No links yet" href="/create" cta="Create" />
                  ) : (
                    <div className="space-y-2">
                      {dashboard.linkCards.map((item) => (
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
              ) : (
                <section className="space-y-3">
                  {dashboard.claimItems.length === 0 ? (
                    <EmptyState title="No claims" />
                  ) : (
                    <div className="space-y-2">
                      {dashboard.claimItems.map((intent) => (
                        <ClaimCard key={intent.id} intent={intent} />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
