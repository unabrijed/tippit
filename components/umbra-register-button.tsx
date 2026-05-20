"use client";

import { useState } from "react";
import { ShieldCheck } from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { registerUmbraUser } from "@/lib/umbra/browser";
import { useNetwork } from "@/components/network-provider";
import { getUmbraWalletSupport } from "@/lib/umbra/wallet";

export function UmbraRegisterButton() {
  const { wallet, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [state, setState] = useState<{ loading: boolean; message?: string; error?: string }>({ loading: false });
  const support = getUmbraWalletSupport(wallet);
  const { network } = useNetwork();

  const isMainnet = network === "mainnet";

  const register = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }

    if (!support.supported) {
      setState({ loading: false, error: support.reason });
      return;
    }

    try {
      setState({ loading: true });
      const signatures = await registerUmbraUser(wallet, network);
      setState({ loading: false, message: signatures.length > 0 ? `Registered with ${signatures.length} Umbra transaction${signatures.length > 1 ? "s" : ""}.` : "Umbra registration already up to date." });
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Could not register with Umbra." });
    }
  };

  return (
    <div className="space-y-3">
      <Button onClick={register} disabled={state.loading || !isMainnet || (connected && !support.supported)} variant="secondary">
        <ShieldCheck aria-hidden className="h-4 w-4" />
        {state.loading ? "Registering…" : !isMainnet ? "Mainnet only" : !connected ? "Connect wallet for Umbra" : support.supported ? "Register wallet with Umbra" : "Use a compatible wallet"}
      </Button>
      {!isMainnet ? <p className="text-xs text-muted-foreground">Umbra private payments require mainnet. Switch networks to register.</p> : null}
      {state.message ? <p className="text-xs text-muted-foreground">{state.message}</p> : null}
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </div>
  );
}
