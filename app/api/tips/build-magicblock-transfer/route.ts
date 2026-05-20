import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { createMagicBlockTipTx } from "@/lib/magicblock/tips";
import { resolveMagicBlockRpc } from "@/lib/magicblock/tx";
import { buildTipTransferSchema } from "@/lib/tippit/validators";
import { getCreatorBySlug, getTipByClientRefId, markTipSigned } from "@/lib/tippit/store";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = buildTipTransferSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid transfer payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const tip = await getTipByClientRefId(parsed.data.clientRefId);
  if (!tip) {
    return NextResponse.json({ error: "Tip intent not found." }, { status: 404 });
  }

  const creator = await getCreatorBySlug(tip.creatorSlug);
  if (!creator) {
    return NextResponse.json({ error: "Creator not found." }, { status: 404 });
  }

  const network = getNetworkFromRequest(request);
  const token = parsed.data.token;

  let tx;
  try {
    tx = await createMagicBlockTipTx({
      fanWallet: parsed.data.fanWallet,
      creatorWallet: creator.walletAddress,
      amountBaseUnits: tip.amount,
      mint: tip.tokenMint,
      clientRefId: tip.clientRefId,
      network,
      token
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "MagicBlock transfer build failed.";
    console.error("[tips/build-magicblock-transfer]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await markTipSigned(tip.clientRefId);

  return NextResponse.json({
    ...tx,
    rpcUrl: resolveMagicBlockRpc(tx, network, token)
  });
}
