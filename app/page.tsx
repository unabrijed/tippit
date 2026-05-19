import Link from "next/link";
import { ArrowRight, Link as LinkIcon, ShieldCheck, Receipt, QrCode } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { MotionSection, MotionStagger, MotionItem } from "@/components/motion";

const steps = [
  {
    title: "Create a private link",
    copy: "Set USDC amount, expiry, and merchant identity.",
    icon: LinkIcon
  },
  {
    title: "Share checkout or QR",
    copy: "Premium checkout — no raw wallet address exposed.",
    icon: QrCode
  },
  {
    title: "Track, confirm, claim",
    copy: "Monitor payments and claim privately via Umbra.",
    icon: Receipt
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl flex-col gap-16 px-4 py-10 md:px-6 lg:px-8 lg:py-16">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <MotionSection className="space-y-8">
          <StatusPill status="claimable">Payment routed privately via Umbra</StatusPill>
          <div className="max-w-3xl space-y-5">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-ghost-smoke">
              GhostPay · Solana-native payment links
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-none text-ghost-ink md:text-6xl lg:text-7xl dark:text-ghost-ivory">
              Get paid without getting watched.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-ghost-smoke md:text-lg dark:text-[#C9C1B8]">
              Create payment links, share premium checkouts, keep wallet exposure low.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/create" size="lg">
              Create payment link
              <ArrowRight aria-hidden className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary" size="lg">
              View dashboard
            </ButtonLink>
          </div>
          <MotionStagger className="grid gap-4 text-sm text-ghost-smoke sm:grid-cols-3 dark:text-[#C9C1B8]" staggerDelay={0.08}>
            <MotionItem>
              <p className="font-medium text-ghost-ink dark:text-ghost-ivory">USDC-first</p>
              <p>SPL transfers on Solana.</p>
            </MotionItem>
            <MotionItem>
              <p className="font-medium text-ghost-ink dark:text-ghost-ivory">Non-custodial</p>
              <p>Wallet signs directly.</p>
            </MotionItem>
            <MotionItem>
              <p className="font-medium text-ghost-ink dark:text-ghost-ivory">Umbra-ready</p>
              <p>Privacy layer built in.</p>
            </MotionItem>
          </MotionStagger>
        </MotionSection>

        <Card className="border border-border bg-[linear-gradient(180deg,rgba(237,233,226,0.96),rgba(247,244,239,0.88))] shadow-soft dark:bg-[linear-gradient(180deg,rgba(35,33,30,0.95),rgba(23,22,20,0.96))]">
          <CardContent className="space-y-8 p-6 md:p-8">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-ghost-smoke">Preview checkout</p>
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-[0.2em] text-ghost-smoke">Merchant verified as</p>
                <p className="text-lg font-semibold text-ghost-pine dark:text-ghost-ivory">Shoonya Studio</p>
              </div>
            </div>
            <div className="space-y-2 border-y border-border py-8">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-ghost-smoke">Amount due</p>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-6xl leading-none text-ghost-ink dark:text-ghost-ivory">50</span>
                <span className="mono-address text-sm uppercase tracking-[0.18em] text-ghost-smoke">USDC</span>
              </div>
              <p className="max-w-sm text-sm leading-6 text-ghost-smoke dark:text-[#C9C1B8]">
                Private payment. Receiver address stays hidden.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-ghost-pine/20 bg-ghost-pine/5 px-4 py-3 text-sm text-ghost-pine dark:bg-ghost-ivory/10 dark:text-ghost-ivory">
                <div className="flex items-center gap-2">
                  <ShieldCheck aria-hidden className="h-5 w-5" />
                  <span>Payment routed privately via Umbra</span>
                </div>
                <StatusPill status="submitted">Pending</StatusPill>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ButtonLink href="/create" size="lg">Try the flow</ButtonLink>
                <ButtonLink href="/receipt/demo-gp-82kx" variant="ghost" size="lg">View receipt sample</ButtonLink>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <MotionStagger className="grid gap-4 md:grid-cols-3" staggerDelay={0.1}>
        {steps.map(({ title, copy, icon: Icon }) => (
          <MotionItem key={title}>
            <Card className="bg-card/80">
              <CardContent className="space-y-4 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ghost-pine/10 text-ghost-pine dark:bg-ghost-ivory/10 dark:text-ghost-ivory">
                  <Icon aria-hidden className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-ghost-ink dark:text-ghost-ivory">{title}</h2>
                  <p className="text-sm leading-6 text-ghost-smoke dark:text-[#C9C1B8]">{copy}</p>
                </div>
              </CardContent>
            </Card>
          </MotionItem>
        ))}
      </MotionStagger>

      <MotionSection delay={0.3} className="rounded-3xl border border-border bg-card/80 p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-ghost-smoke">What ships in this build</p>
            <h2 className="font-display text-4xl text-ghost-ink dark:text-ghost-ivory">A polished product shell with a live Solana payment path.</h2>
            <p className="text-sm leading-6 text-ghost-smoke dark:text-[#C9C1B8]">
              Payment links, SPL transfers, receipts — ready for Umbra privacy layer.
            </p>
          </div>
          <Link href="/create" className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-ghost-pine underline-offset-4 transition hover:text-ghost-sage hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            Build your first payment link
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </MotionSection>
    </main>
  );
}
