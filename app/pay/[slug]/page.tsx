import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getPaymentLinkBySlug } from "@/lib/db/store";
import { SolanaWalletProvider } from "@/components/solana-wallet-provider";

const PayFlow = dynamic(
  () => import("@/components/pay-flow").then((m) => m.PayFlow),
  { ssr: false, loading: () => <div className="h-[500px] animate-pulse rounded-lg border border-border bg-card/50" /> }
);

export default async function PayPage({ params }: { params: { slug: string } }) {
  const link = await getPaymentLinkBySlug(params.slug);
  if (!link) notFound();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:px-6 lg:px-8 lg:py-16">
      <div className="space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-ghost-smoke">Private checkout</p>
        <h1 className="font-display text-5xl leading-none text-ghost-ink dark:text-ghost-ivory">{link.title}</h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-ghost-smoke dark:text-[#C9C1B8]">Pay in SOL or USDC on Solana. Switch to the same network as the link before signing.</p>
      </div>
      <SolanaWalletProvider>
        <PayFlow link={link} />
      </SolanaWalletProvider>
    </main>
  );
}
