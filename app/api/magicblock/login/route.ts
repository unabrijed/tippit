import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { loginToMagicBlock } from "@/lib/magicblock/auth";
import { persistCreatorSession } from "@/lib/tippit/cookies";
import { getCreatorByWallet } from "@/lib/tippit/store";
import { loginSchema } from "@/lib/tippit/validators";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const network = getNetworkFromRequest(request);
  const result = await loginToMagicBlock({
    pubkey: parsed.data.walletAddress,
    challenge: parsed.data.challenge,
    signature: parsed.data.signature,
    network
  });

  const creator = await getCreatorByWallet(parsed.data.walletAddress);
  persistCreatorSession({ walletAddress: parsed.data.walletAddress, token: result.token, slug: creator?.slug });

  return NextResponse.json({ ok: true, tokenStored: true });
}
