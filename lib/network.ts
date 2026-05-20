import { Cluster } from "@solana/web3.js";

export const NETWORK_HEADER = "x-tippit-network";
export const APP_NETWORKS = ["mainnet", "devnet"] as const;
export type AppNetwork = (typeof APP_NETWORKS)[number];

const NETWORK_CONFIG = {
  mainnet: {
    id: "mainnet",
    label: "Mainnet",
    cluster: "mainnet-beta" as Cluster,
    umbraNetwork: "mainnet" as const,
    defaultRpcUrl: "https://api.mainnet-beta.solana.com",
    defaultUmbraIndexerApiEndpoint: "https://utxo-indexer.api.umbraprivacy.com",
    defaultUmbraRelayerApiEndpoint: "https://relayer.api.umbraprivacy.com"
  },
  devnet: {
    id: "devnet",
    label: "Devnet",
    cluster: "devnet" as Cluster,
    umbraNetwork: "devnet" as const,
    defaultRpcUrl: "https://api.devnet.solana.com",
    defaultUmbraIndexerApiEndpoint: "https://utxo-indexer.api-devnet.umbraprivacy.com",
    defaultUmbraRelayerApiEndpoint: "https://relayer.api-devnet.umbraprivacy.com"
  }
} as const;

function isAppNetwork(value: string): value is AppNetwork {
  return (APP_NETWORKS as readonly string[]).includes(value);
}

export function normalizeNetwork(value?: string | null): AppNetwork {
  if (!value) return "mainnet";
  const normalized = value.toLowerCase();
  if (normalized === "mainnet-beta") return "mainnet";
  if (isAppNetwork(normalized)) return normalized;
  return "mainnet";
}

export const DEFAULT_APP_NETWORK = normalizeNetwork(process.env.NEXT_PUBLIC_SOLANA_NETWORK);

export function getAppNetworkConfig(network: AppNetwork) {
  const base = NETWORK_CONFIG[network];
  const suffix = network.toUpperCase();

  return {
    ...base,
    rpcUrl:
      process.env[`NEXT_PUBLIC_SOLANA_RPC_URL_${suffix}`] ||
      (network === "mainnet" ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL : undefined) ||
      base.defaultRpcUrl,
    umbraIndexerApiEndpoint:
      process.env[`NEXT_PUBLIC_UMBRA_INDEXER_API_ENDPOINT_${suffix}`] ||
      (network === "devnet" ? process.env.NEXT_PUBLIC_UMBRA_INDEXER_API_ENDPOINT_TESTNET : undefined) ||
      (network === "mainnet" ? process.env.NEXT_PUBLIC_UMBRA_INDEXER_API_ENDPOINT : undefined) ||
      base.defaultUmbraIndexerApiEndpoint,
    umbraRelayerApiEndpoint:
      process.env[`NEXT_PUBLIC_UMBRA_RELAYER_API_ENDPOINT_${suffix}`] ||
      (network === "devnet" ? process.env.NEXT_PUBLIC_UMBRA_RELAYER_API_ENDPOINT_TESTNET : undefined) ||
      (network === "mainnet" ? process.env.NEXT_PUBLIC_UMBRA_RELAYER_API_ENDPOINT : undefined) ||
      base.defaultUmbraRelayerApiEndpoint
  };
}

export function getNetworkFromRequest(request: Request): AppNetwork {
  return normalizeNetwork(request.headers.get(NETWORK_HEADER));
}
