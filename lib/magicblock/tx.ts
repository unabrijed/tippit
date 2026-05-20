import { Transaction, VersionedTransaction } from "@solana/web3.js";
import type { AppNetwork } from "@/lib/network";
import { getAppNetworkConfig } from "@/lib/network";
import { getMagicBlockEphemeralRpc, getMagicBlockTeeBase } from "@/lib/magicblock/constants";
import type { MagicBlockUnsignedTransaction } from "@/lib/tippit/types";

export function deserializeMagicBlockTransaction(base64: string) {
  const bytes = Buffer.from(base64, "base64");
  try {
    return VersionedTransaction.deserialize(bytes);
  } catch {
    return Transaction.from(bytes);
  }
}

export function resolveMagicBlockRpc(payload: MagicBlockUnsignedTransaction, network: AppNetwork, token?: string) {
  const withToken = (url: string) => token ? `${url}?token=${encodeURIComponent(token)}` : url;

  if (payload.validator?.startsWith("http")) return withToken(payload.validator);

  if (payload.sendTo === "ephemeral") {
    const configured = getMagicBlockEphemeralRpc(network);
    if (configured) return withToken(configured);
    return withToken(getMagicBlockTeeBase(network));
  }

  return getAppNetworkConfig(network).rpcUrl;
}
