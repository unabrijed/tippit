import { createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { type AppNetwork } from "@/lib/network";
import { getConnection } from "@/lib/solana/connection";
import { DEFAULT_SOL_DECIMALS, DEFAULT_USDC_DECIMALS, type SupportedToken } from "@/lib/solana/tokens";

export async function buildPublicTransferTransaction({
  payerWallet,
  receiverWallet,
  tokenType,
  tokenMint,
  amount,
  network
}: {
  payerWallet: string;
  receiverWallet: string;
  tokenType: SupportedToken;
  tokenMint?: string;
  amount: number;
  network: AppNetwork;
}) {
  const payer = new PublicKey(payerWallet);
  const receiver = new PublicKey(receiverWallet);
  const connection = getConnection(network);
  const transaction = new Transaction();

  if (tokenType === "SOL") {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: receiver,
        lamports: Math.round(amount * 10 ** DEFAULT_SOL_DECIMALS)
      })
    );
  } else {
    if (!tokenMint) throw new Error("USDC mint is required.");

    const mint = new PublicKey(tokenMint);
    const fromAta = getAssociatedTokenAddressSync(mint, payer);
    const toAta = getAssociatedTokenAddressSync(mint, receiver);
    const destinationInfo = await connection.getAccountInfo(toAta);

    if (!destinationInfo) {
      transaction.add(createAssociatedTokenAccountInstruction(payer, toAta, receiver, mint));
    }

    transaction.add(
      createTransferCheckedInstruction(
        fromAta,
        mint,
        toAta,
        payer,
        BigInt(Math.round(amount * 10 ** DEFAULT_USDC_DECIMALS)),
        DEFAULT_USDC_DECIMALS
      )
    );
  }

  transaction.feePayer = payer;
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = latestBlockhash.blockhash;

  return transaction;
}
