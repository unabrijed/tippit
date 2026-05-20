import { NextResponse } from "next/server";
import { getAppEnv } from "@/lib/env";
import { getNetworkFromRequest } from "@/lib/network";
import { createPaymentLink, listPaymentLinksByWallet } from "@/lib/db/store";
import { paymentLinkSchema } from "@/lib/validators/payment-link";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("merchantWallet");
  if (!wallet) {
    return NextResponse.json({ links: [] });
  }

  const network = getNetworkFromRequest(request);
  return NextResponse.json({ links: await listPaymentLinksByWallet(wallet, network) });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = paymentLinkSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid tip link payload.",
        errors: Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]))
      },
      { status: 400 }
    );
  }

  const network = getNetworkFromRequest(request);
  const appEnv = getAppEnv(network);
  const link = await createPaymentLink({ ...parsed.data, network });
  return NextResponse.json(
    {
      id: link.id,
      slug: link.slug,
      url: `${appEnv.appUrl}/pay/${link.slug}`,
      qrUrl: `${appEnv.appUrl}/api/solana-pay/${link.slug}`,
      link
    },
    { status: 201 }
  );
}
