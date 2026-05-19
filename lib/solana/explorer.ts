import { DEFAULT_APP_NETWORK, type AppNetwork, getAppNetworkConfig } from "@/lib/network";

function getExplorerSuffix(network: AppNetwork) {
  const cluster = getAppNetworkConfig(network).cluster;
  return cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
}

export function explorerAddressUrl(address: string, network: AppNetwork = DEFAULT_APP_NETWORK) {
  return `https://explorer.solana.com/address/${address}${getExplorerSuffix(network)}`;
}

export function explorerTxUrl(signature: string, network: AppNetwork = DEFAULT_APP_NETWORK) {
  return `https://explorer.solana.com/tx/${signature}${getExplorerSuffix(network)}`;
}
