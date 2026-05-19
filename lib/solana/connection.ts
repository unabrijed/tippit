import { Connection } from "@solana/web3.js";
import { DEFAULT_APP_NETWORK, type AppNetwork, getAppNetworkConfig } from "@/lib/network";

const connections = new Map<AppNetwork, Connection>();

export function getRpcEndpoint(network: AppNetwork = DEFAULT_APP_NETWORK) {
  return getAppNetworkConfig(network).rpcUrl;
}

export function getConnection(network: AppNetwork = DEFAULT_APP_NETWORK) {
  const existing = connections.get(network);
  if (existing) return existing;

  const connection = new Connection(getRpcEndpoint(network), "confirmed");
  connections.set(network, connection);
  return connection;
}
