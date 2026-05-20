import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { getPaymentIntentById, getPaymentLinkById } from "@/lib/db/store";
import { buildPublicTransferTransaction } from "@/lib/solana/build-public-transfer";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const intent = await getPaymentIntentById(params.id);
  if (!intent) {
    return NextResponse.json({ error: "Payment intent not found." }, { status: 404 });
  }

  try {
    const network = getNetworkFromRequest(request);
    if (intent.network !== network) {
      return NextResponse.json({ error: `This payment belongs to ${intent.network}. Switch networks and try again.` }, { status: 400 });
    }
    const link = await getPaymentLinkById(intent.paymentLinkId);
    if (link?.tokenType === "USDC" && link.privacyMode === "umbra_utxo") {
      return NextResponse.json({ error: "This USDC tip link is private-only and must be sent through Umbra." }, { status: 400 });
    }
    const transaction = await buildPublicTransferTransaction({
      payerWallet: body.payerWallet ?? intent.payerWallet ?? "",
      receiverWallet: intent.receiverWallet,
      tokenType: intent.tokenType,
      tokenMint: intent.tokenMint,
      amount: intent.amount,
      network
    });

    return NextResponse.json({
      serializedTransaction: transaction.serialize({ requireAllSignatures: false }).toString("base64")
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not build transaction." }, { status: 400 });
  }
}
