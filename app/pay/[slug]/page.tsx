import { notFound } from "next/navigation";
import { getPaymentLinkBySlug } from "@/lib/db/store";
import { SolanaWalletProvider } from "@/components/solana-wallet-provider";
import { PayFlow } from "@/components/pay-flow";
import { PaymentRailSwitcher } from "@/components/payment-rail-switcher";

export default async function PayPage({ params }: { params: { slug: string } }) {
  const link = await getPaymentLinkBySlug(params.slug);
  if (!link) notFound();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-md flex-col items-center justify-center px-4 py-10">
      <SolanaWalletProvider>
        <div className="flex flex-col items-center gap-4 w-full">
          {link.tokenType !== "SOL" && <PaymentRailSwitcher />}
          <PayFlow link={link} />
        </div>
      </SolanaWalletProvider>
    </main>
  );
}
