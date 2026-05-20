import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { createWithdrawTx } from "@/lib/magicblock/withdraw";
import { resolveMagicBlockRpc } from "@/lib/magicblock/tx";
import { getCreatorSession } from "@/lib/tippit/cookies";
import { DEFAULT_TOKEN_SYMBOL, getUsdcMint } from "@/lib/tippit/constants";
import { createWithdrawal, getCreatorByWallet, markWithdrawalConfirmed } from "@/lib/tippit/store";
import { withdrawSchema } from "@/lib/tippit/validators";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = withdrawSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid withdrawal payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const session = getCreatorSession();
  if (!session.walletAddress || !session.token) {
    return NextResponse.json({ error: "Unlock your private balance first." }, { status: 401 });
  }

  const creator = await getCreatorByWallet(session.walletAddress);
  if (!creator) {
    return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
  }
  if (creator.defaultRail === "umbra") {
    return NextResponse.json({ error: "MagicBlock withdrawals are unavailable when Umbra is selected as the default protocol." }, { status: 400 });
  }

  if (parsed.data.txSignature && parsed.data.withdrawalId) {
    const confirmed = await markWithdrawalConfirmed(parsed.data.withdrawalId, parsed.data.txSignature);
    if (!confirmed) {
      return NextResponse.json({ error: "Withdrawal not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, withdrawal: confirmed });
  }

  const network = getNetworkFromRequest(request);
  const withdrawal = await createWithdrawal({
    creatorId: creator.id,
    amount: parsed.data.amount,
    amountUi: parsed.data.amountUi,
    tokenMint: getUsdcMint(network),
    tokenSymbol: DEFAULT_TOKEN_SYMBOL,
    status: "created"
  });

  const tx = await createWithdrawTx({
    creatorWallet: creator.walletAddress,
    amountBaseUnits: parsed.data.amount,
    mint: withdrawal.tokenMint,
    token: session.token,
    network
  });

  return NextResponse.json({
    withdrawalId: withdrawal.id,
    ...tx,
    rpcUrl: resolveMagicBlockRpc(tx, network)
  });
}
