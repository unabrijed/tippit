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

  // MagicBlock transactions can be submitted to either the ephemeral rollup RPC
  // or the base Solana chain depending on the `sendTo` field returned by MagicBlock.
  // Only use the ephemeral RPC when sendTo === "ephemeral"; base/mainnet transactions
  // must be confirmed on the regular Solana connection.
  let connection: Connection;
  if (body.isMagicBlock && body.sendTo === "ephemeral") {
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
