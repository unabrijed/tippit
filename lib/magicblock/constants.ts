import type { AppNetwork } from "@/lib/network";

export function getMagicBlockApiBase() {
  return process.env.MAGICBLOCK_API_BASE_URL || "https://payments.magicblock.app";
}

export function getMagicBlockCluster(network: AppNetwork) {
  return network === "mainnet" ? "mainnet" : "devnet";
}

export function getMagicBlockEphemeralRpc(network: AppNetwork) {
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_MAGICBLOCK_EPHEMERAL_RPC_MAINNET || process.env.MAGICBLOCK_EPHEMERAL_RPC_MAINNET
    : process.env.NEXT_PUBLIC_MAGICBLOCK_EPHEMERAL_RPC_DEVNET || process.env.MAGICBLOCK_EPHEMERAL_RPC_DEVNET;
}
