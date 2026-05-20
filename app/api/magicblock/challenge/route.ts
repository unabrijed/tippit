import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { getMagicBlockChallenge } from "@/lib/magicblock/auth";
import { challengeSchema } from "@/lib/tippit/validators";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = challengeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "walletAddress is required." }, { status: 400 });
  }

  const network = getNetworkFromRequest(request);
  try {
    const challenge = await getMagicBlockChallenge(parsed.data.walletAddress, network);
    return NextResponse.json(challenge);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[magicblock/challenge]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
