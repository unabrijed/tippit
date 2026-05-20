import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { loginToMagicBlock } from "@/lib/magicblock/auth";
import { loginSchema } from "@/lib/tippit/validators";

// Payer-side token exchange: returns the token directly to the client
// without persisting a server-side cookie. Used before building a transfer.
export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const network = getNetworkFromRequest(request);
  let result: { token: string };
  try {
    result = await loginToMagicBlock({
      pubkey: parsed.data.walletAddress,
      challenge: parsed.data.challenge,
      signature: parsed.data.signature,
      network
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "MagicBlock auth failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ token: result.token });
}
