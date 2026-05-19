import { NextResponse } from "next/server";
import { getPaymentLinkBySlug } from "@/lib/db/store";
import { getGhostPayCheckoutUrl, getSolanaPayTransferUrl } from "@/lib/solana/solana-pay";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const link = await getPaymentLinkBySlug(params.slug);
  if (!link) {
    return NextResponse.json({ error: "Payment link not found." }, { status: 404 });
  }

  return NextResponse.json({
    url: getSolanaPayTransferUrl(link),
    checkoutUrl: getGhostPayCheckoutUrl(link),
    mode: "transfer-request"
  });
}
