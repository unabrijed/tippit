import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { getCreatorSession } from "@/lib/tippit/cookies";
import { getCreatorByWallet, getCreatorDashboard } from "@/lib/tippit/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet") || getCreatorSession().walletAddress;
  if (!wallet) {
    return NextResponse.json({ error: "wallet is required." }, { status: 400 });
  }

  const creator = await getCreatorByWallet(wallet);
  if (!creator) {
    return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
  }

  const network = getNetworkFromRequest(request);
  const session = getCreatorSession();
  return NextResponse.json(await getCreatorDashboard({ creator, network, hasMagicBlockSession: Boolean(session.token) }));
}
