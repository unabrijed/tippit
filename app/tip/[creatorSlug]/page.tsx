import { notFound } from "next/navigation";
import { SolanaWalletProvider } from "@/components/solana-wallet-provider";
import { TipCheckout } from "@/components/tip-checkout";
import { PaymentRailSwitcher } from "@/components/payment-rail-switcher";
import { getCreatorBySlug } from "@/lib/tippit/store";

export default async function TipPage({ params }: { params: { creatorSlug: string } }) {
  const creator = await getCreatorBySlug(params.creatorSlug);
  if (!creator) notFound();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-md flex-col items-center justify-center px-4 py-10">
      <p className="mb-6 text-sm font-medium text-muted-foreground">{creator.displayName}</p>
      <SolanaWalletProvider>
        <div className="flex flex-col items-center gap-4 w-full">
          <PaymentRailSwitcher />
          <TipCheckout creator={creator} />
        </div>
      </SolanaWalletProvider>
    </main>
  );
}
