import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { getUsdcMint, DEFAULT_TOKEN_SYMBOL } from "@/lib/tippit/constants";
import { createTipSchema } from "@/lib/tippit/validators";
import { createTip, getCreatorBySlug } from "@/lib/tippit/store";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createTipSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tip payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const creator = await getCreatorBySlug(parsed.data.creatorSlug);
  if (!creator) {
    return NextResponse.json({ error: "Creator not found." }, { status: 404 });
  }

  const network = getNetworkFromRequest(request);
  const clientRefId = `tip_${randomUUID()}`;
  const tip = await createTip({
    creatorId: creator.id,
    creatorSlug: creator.slug,
    fanWalletAddress: parsed.data.fanWalletAddress,
    amount: parsed.data.amount,
    amountUi: parsed.data.amountUi,
    tokenMint: getUsdcMint(network),
    tokenSymbol: DEFAULT_TOKEN_SYMBOL,
    message: parsed.data.message || undefined,
    visibility: parsed.data.visibility,
    clientRefId,
    paymentRail: creator.defaultRail
  });

  return NextResponse.json({
    tip,
    clientRefId,
    creatorWallet: creator.walletAddress,
    mint: tip.tokenMint
  }, { status: 201 });
}
