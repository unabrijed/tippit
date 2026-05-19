import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { claimIntent, getPaymentIntentById } from "@/lib/db/store";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const network = getNetworkFromRequest(request);
    const intent = await getPaymentIntentById(params.id);
    if (!intent) {
      return NextResponse.json({ error: "Payment intent not found." }, { status: 404 });
    }
    if (intent.network !== network) {
      return NextResponse.json({ error: `This payment belongs to ${intent.network}. Switch networks and try again.` }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await claimIntent(params.id, body.claimSignature);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not claim payment." }, { status: 400 });
  }
}
