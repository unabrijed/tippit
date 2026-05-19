import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { getDashboard, getPersistenceMode } from "@/lib/db/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet is required." }, { status: 400 });
  }

  const network = getNetworkFromRequest(request);
  return NextResponse.json({ ...(await getDashboard(wallet, network)), persistenceMode: getPersistenceMode(), network });
}
