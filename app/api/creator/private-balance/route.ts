import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { getPrivateBalance } from "@/lib/magicblock/balances";
import { getCreatorSession } from "@/lib/tippit/cookies";
import { getUsdcMint } from "@/lib/tippit/constants";
import { getCreatorByWallet } from "@/lib/tippit/store";

export async function GET(request: Request) {
  const session = getCreatorSession();
  if (!session.walletAddress || !session.token) {
    return NextResponse.json({ error: "Unlock your private balance first." }, { status: 401 });
  }

  const creator = await getCreatorByWallet(session.walletAddress);
  if (!creator) {
    return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
  }
  if (creator.defaultRail === "umbra") {
    return NextResponse.json({ error: "MagicBlock balance is unavailable when Umbra is selected as the default protocol." }, { status: 400 });
  }

  const network = getNetworkFromRequest(request);
  const balance = await getPrivateBalance({
    address: session.walletAddress,
    mint: getUsdcMint(network),
    token: session.token,
    network
  });

  return NextResponse.json(balance);
}
