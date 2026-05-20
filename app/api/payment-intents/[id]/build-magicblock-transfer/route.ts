import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { createMagicBlockTipTx } from "@/lib/magicblock/tips";
import { resolveMagicBlockRpc } from "@/lib/magicblock/tx";
import { getPaymentIntentById } from "@/lib/db/store";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const intent = await getPaymentIntentById(params.id);
  if (!intent) {
    return NextResponse.json({ error: "Payment intent not found." }, { status: 404 });
  }
  if (intent.status !== "awaiting_signature") {
    return NextResponse.json({ error: "Payment intent is not awaiting signature." }, { status: 400 });
  }
  if (!intent.tokenMint) {
    return NextResponse.json({ error: "Token mint is required for MagicBlock transfers." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const fanWallet = body.payerWallet ?? intent.payerWallet;
  if (!fanWallet) {
    return NextResponse.json({ error: "payerWallet is required." }, { status: 400 });
  }

  const network = getNetworkFromRequest(request);
  const token: string | undefined = typeof body.token === "string" ? body.token : undefined;

  let tx;
  try {
    tx = await createMagicBlockTipTx({
      fanWallet,
      creatorWallet: intent.receiverWallet,
      amountBaseUnits: String(Math.round(intent.amount * 1_000_000)),
      mint: intent.tokenMint,
      clientRefId: intent.id,
      network,
      token
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "MagicBlock transfer build failed.";
    console.error("[build-magicblock-transfer]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({
    ...tx,
    rpcUrl: resolveMagicBlockRpc(tx, network, token)
  });
}
