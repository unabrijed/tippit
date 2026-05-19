import { ShieldCheck, Sparkle } from "@phosphor-icons/react/dist/ssr";
import dynamic from "next/dynamic";
import { MotionSection, MotionStagger, MotionItem } from "@/components/motion";
import { SolanaWalletProvider } from "@/components/solana-wallet-provider";

const CreateLinkForm = dynamic(
  () => import("@/components/create-link-form").then((m) => m.CreateLinkForm),
  { ssr: false, loading: () => <div className="h-[600px] animate-pulse rounded-lg border border-border bg-card/50" /> }
);

export default function CreatePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 md:px-6 lg:px-8 lg:py-16">
      <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <MotionSection className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ghost-smoke">Create payment link</p>
            <h1 className="font-display text-5xl leading-none text-ghost-ink dark:text-ghost-ivory">Build a premium checkout in one pass.</h1>
            <p className="max-w-xl text-base leading-7 text-ghost-smoke dark:text-[#C9C1B8]">
              Fixed USDC amount, clean checkout, minimal wallet exposure.
            </p>
          </div>
          <MotionStagger className="space-y-4 rounded-lg border border-border bg-card/70 p-5" staggerDelay={0.1}>
            <MotionItem>
              <div className="flex items-start gap-3">
                <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 text-ghost-pine dark:text-ghost-ivory" />
                <div>
                  <p className="font-medium text-ghost-ink dark:text-ghost-ivory">Lower wallet exposure</p>
                  <p className="mt-1 text-sm leading-6 text-ghost-smoke dark:text-[#C9C1B8]">Brand-first checkout. Umbra privacy path ready.</p>
                </div>
              </div>
            </MotionItem>
            <MotionItem>
              <div className="flex items-start gap-3">
                <Sparkle aria-hidden className="mt-0.5 h-5 w-5 text-ghost-gold" />
                <div>
                  <p className="font-medium text-ghost-ink dark:text-ghost-ivory">Live SPL transfers</p>
                  <p className="mt-1 text-sm leading-6 text-ghost-smoke dark:text-[#C9C1B8]">Real transactions now. Privacy layer later.</p>
                </div>
              </div>
            </MotionItem>
          </MotionStagger>
        </MotionSection>
        <MotionSection delay={0.2}>
          <SolanaWalletProvider>
            <CreateLinkForm />
          </SolanaWalletProvider>
        </MotionSection>
      </section>
    </main>
  );
}
