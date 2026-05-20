import { notFound } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { getReceiptByCode } from "@/lib/db/store";
import { AmbientBackdrop } from "@/components/brand-primitives";

export default async function ReceiptPage({ params }: { params: { code: string } }) {
  const receipt = await getReceiptByCode(params.code);
  if (!receipt) notFound();

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-md flex-col items-center justify-center px-4 py-10">
      <AmbientBackdrop />

      <div className="relative flex flex-col items-center gap-6 text-center">
        {/* Success animation */}
        <div className="icon-circle-lg animate-scale-in text-success">
          <CheckCircle className="h-8 w-8" weight="fill" />
        </div>

        {/* Amount */}
        <div className="flex items-end gap-2">
          <span className="text-6xl font-bold tracking-tight text-foreground">{receipt.amount}</span>
          <span className="mono-address pb-2 text-sm uppercase tracking-wider text-muted-foreground">{receipt.tokenSymbol}</span>
        </div>

        {/* Creator */}
        <p className="text-sm font-medium text-muted-foreground">{receipt.displayName}</p>

        {/* Receipt code */}
        <p className="mono-address text-xs text-muted-foreground/60">{receipt.receiptCode}</p>
      </div>
    </main>
  );
}
