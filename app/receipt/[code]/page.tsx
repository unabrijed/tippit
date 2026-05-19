import { notFound } from "next/navigation";
import { CheckCircle, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { getReceiptByCode } from "@/lib/db/store";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";

export default async function ReceiptPage({ params }: { params: { code: string } }) {
  const receipt = await getReceiptByCode(params.code);
  if (!receipt) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 md:px-6 lg:px-8 lg:py-16">
      <div className="space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-ghost-smoke">Receipt</p>
        <h1 className="font-display text-5xl leading-none text-ghost-ink dark:text-ghost-ivory">Payment completed</h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-ghost-smoke dark:text-[#C9C1B8]">A minimal public receipt that confirms the payment loop without revealing more wallet data than needed.</p>
      </div>

      <Card className="border border-ghost-gold/40 bg-[linear-gradient(180deg,rgba(247,244,239,0.98),rgba(237,233,226,0.92))] shadow-soft dark:bg-[linear-gradient(180deg,rgba(35,33,30,0.95),rgba(23,22,20,0.98))]">
        <CardContent className="space-y-8 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ghost-gold/15 text-ghost-pine">
                <CheckCircle aria-hidden className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-ghost-smoke">Receipt code</p>
                <p className="mono-address text-lg text-ghost-ink dark:text-ghost-ivory">{receipt.receiptCode}</p>
              </div>
            </div>
            <StatusPill status={receipt.status === "issued" ? "claimed" : "claimable"}>{receipt.intentStatus}</StatusPill>
          </div>

          <div className="grid gap-6 border-y border-border py-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-ghost-smoke">Amount</p>
              <p className="mt-2 font-display text-6xl leading-none text-ghost-ink dark:text-ghost-ivory">{receipt.amount}</p>
              <p className="mono-address mt-2 text-sm uppercase tracking-[0.18em] text-ghost-smoke">{receipt.tokenSymbol}</p>
            </div>
            <div className="space-y-4 text-sm text-ghost-smoke dark:text-[#C9C1B8]">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em]">Merchant</p>
                <p className="mt-1 text-ghost-ink dark:text-ghost-ivory">{receipt.displayName}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em]">Status</p>
                <p className="mt-1 text-ghost-ink dark:text-ghost-ivory">{receipt.intentStatus.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em]">Confirmed</p>
                <p className="mt-1 text-ghost-ink dark:text-ghost-ivory">{formatDateTime(receipt.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-ghost-pine/20 bg-ghost-pine/5 p-4 text-sm text-ghost-pine dark:bg-ghost-ivory/10 dark:text-ghost-ivory">
            <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5" />
            <p>GhostPay reduces public wallet exposure by routing toward a privacy-first product flow. Direct sender and receiver wallet relationships are not foregrounded on this receipt.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
