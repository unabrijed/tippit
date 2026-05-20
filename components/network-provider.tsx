"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { APP_NETWORKS, DEFAULT_APP_NETWORK, type AppNetwork, getAppNetworkConfig, normalizeNetwork } from "@/lib/network";

const STORAGE_KEY = "tippit:network";

type NetworkContextValue = {
  network: AppNetwork;
  setNetwork: (network: AppNetwork) => void;
  config: ReturnType<typeof getAppNetworkConfig>;
  availableNetworks: typeof APP_NETWORKS;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<AppNetwork>(DEFAULT_APP_NETWORK);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setNetworkState(normalizeNetwork(saved));
    }
  }, []);

  const setNetwork = (value: AppNetwork) => {
    setNetworkState(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  };

  const value = useMemo(
    () => ({
      network,
      setNetwork,
      config: getAppNetworkConfig(network),
      availableNetworks: APP_NETWORKS
    }),
    [network]
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const value = useContext(NetworkContext);
  if (!value) throw new Error("useNetwork must be used inside NetworkProvider.");
  return value;
}
