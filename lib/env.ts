import { DEFAULT_APP_NETWORK, type AppNetwork, getAppNetworkConfig } from "@/lib/network";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) || "http://localhost:3000";
}

function getValkeyUrl() {
  return process.env.AIVEN_VALKEY_URL || process.env.VALKEY_URL || process.env.REDIS_URL;
}

export function getPostgresUrl() {
  return (
    process.env.POSTGRES_AIVEN_URL ||
    process.env.AIVEN_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_AIVEN_KEY
  );
}

export function getAppEnv(network: AppNetwork = DEFAULT_APP_NETWORK) {
  const config = getAppNetworkConfig(network);
  return {
    appUrl: getBaseUrl(),
    valkeyUrl: getValkeyUrl(),
    isValkeyConfigured: Boolean(getValkeyUrl()),
    postgresUrl: getPostgresUrl(),
    isPostgresConfigured: Boolean(getPostgresUrl()),
    umbraNetwork: config.umbraNetwork,
    umbraIndexerApiEndpoint: config.umbraIndexerApiEndpoint,
    umbraRelayerApiEndpoint: config.umbraRelayerApiEndpoint,
    rpcUrl: config.rpcUrl
  } as const;
}

export const appEnv = getAppEnv();
