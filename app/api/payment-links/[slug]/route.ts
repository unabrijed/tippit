import { NextResponse } from "next/server";
import { getPaymentLinkBySlug } from "@/lib/db/store";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const link = await getPaymentLinkBySlug(params.slug);
  if (!link) {
    return NextResponse.json({ error: "Payment link not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: link.id,
    slug: link.slug,
    title: link.title,
    description: link.description,
    amount: link.amount,
    tokenMint: link.tokenMint,
    tokenSymbol: link.tokenSymbol,
    status: link.status,
    expiresAt: link.expiresAt,
    displayName: link.displayName,
    privacyMode: link.privacyMode,
    isExpired: link.isExpired
  });
}
