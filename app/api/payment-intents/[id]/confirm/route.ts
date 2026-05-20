import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { getNetworkFromRequest } from "@/lib/network";
import { getConnection } from "@/lib/solana/connection";
import { getMagicBlockEphemeralRpc, getMagicBlockTeeBase } from "@/lib/magicblock/constants";
import { issueReceiptForIntent, markIntentClaimable, markIntentFailed, markIntentSubmitted } from "@/lib/db/store";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  if (!body.signature) {
    return NextResponse.json({ error: "signature is required." }, { status: 400 });
  }

  const network = getNetworkFromRequest(request);

  // MagicBlock transactions live on the ephemeral rollup RPC, not on the main
  // Solana chain. Use the ephemeral RPC for confirmation when the caller flags
  // that this was a MagicBlock payment.
  let connection: Connection;
  if (body.isMagicBlock) {
    const ephemeralRpc = getMagicBlockEphemeralRpc(network) ?? getMagicBlockTeeBase(network);
    connection = new Connection(ephemeralRpc, "confirmed");
  } else {
    connection = getConnection(network);
  }

  await markIntentSubmitted(params.id, body.signature);
  const status = await connection.getSignatureStatus(body.signature, { searchTransactionHistory: true });
  const confirmation = status.value;
  if (!confirmation || confirmation.err) {
    await markIntentFailed(params.id, "Signature could not be confirmed.");
    return NextResponse.json({ error: "Transaction was not confirmed on Solana." }, { status: 400 });
  }

  const intent = await markIntentClaimable(params.id, body.signature, body.umbraUtxoCommitment);
  if (!intent) {
    return NextResponse.json({ error: "Payment intent not found." }, { status: 404 });
  }

  const receipt = await issueReceiptForIntent(params.id);
  return NextResponse.json({ intent, receipt }, { status: 200 });
}
