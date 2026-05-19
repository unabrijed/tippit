import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { upsertMerchant } from "@/lib/db/store";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.walletAddress) {
    return NextResponse.json({ error: "walletAddress is required." }, { status: 400 });
  }

  const network = getNetworkFromRequest(request);
  const merchant = await upsertMerchant(body.walletAddress, body.displayName, network);
  return NextResponse.json(merchant, { status: 201 });
}
