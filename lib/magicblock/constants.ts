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

export function getMagicBlockTeeBase(network: AppNetwork) {
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_MAGICBLOCK_TEE_BASE_MAINNET || "https://mainnet-tee.magicblock.app"
    : process.env.NEXT_PUBLIC_MAGICBLOCK_TEE_BASE_DEVNET || "https://devnet-tee.magicblock.app";
}
