import { Transaction, VersionedTransaction } from "@solana/web3.js";
import type { AppNetwork } from "@/lib/network";
import { getAppNetworkConfig } from "@/lib/network";
import { getMagicBlockEphemeralRpc } from "@/lib/magicblock/constants";
import type { MagicBlockUnsignedTransaction } from "@/lib/tippit/types";

export function deserializeMagicBlockTransaction(base64: string) {
  const bytes = Buffer.from(base64, "base64");
  try {
    return VersionedTransaction.deserialize(bytes);
  } catch {
    return Transaction.from(bytes);
  }
}

export function resolveMagicBlockRpc(payload: MagicBlockUnsignedTransaction, network: AppNetwork) {
  if (payload.validator?.startsWith("http")) return payload.validator;
  if (payload.sendTo === "ephemeral") return getMagicBlockEphemeralRpc(network) || getAppNetworkConfig(network).rpcUrl;
  return getAppNetworkConfig(network).rpcUrl;
}
