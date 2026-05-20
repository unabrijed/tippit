"use client";

import { useEffect, useState } from "react";
import { CheckCircle, ShieldCheck } from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { checkUmbraRegistration, registerUmbraUser } from "@/lib/umbra/browser";
import { useNetwork } from "@/components/network-provider";
import { getUmbraWalletSupport } from "@/lib/umbra/wallet";

type RegistrationStatus = "unknown" | "checking" | "registered" | "unregistered";

export function UmbraRegisterButton() {
  const { wallet, connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [registerError, setRegisterError] = useState<string | undefined>();
  const [registerLoading, setRegisterLoading] = useState(false);
  // Start checking immediately when on mainnet + wallet is connected + compatible.
  // Default to "checking" so we never flash the register button for already-registered wallets.
  const [regStatus, setRegStatus] = useState<RegistrationStatus>("unknown");
  const support = getUmbraWalletSupport(wallet);
  const { network } = useNetwork();

  const isMainnet = network === "mainnet";
  const shouldCheck = isMainnet && connected && !!publicKey && support.supported;

  useEffect(() => {
    if (!shouldCheck) {
      setRegStatus("unknown");
      return;
    }
    let cancelled = false;
    setRegStatus("checking");
    checkUmbraRegistration(wallet, network)
      .then((isRegistered) => {
        if (!cancelled) setRegStatus(isRegistered ? "registered" : "unregistered");
      })
      .catch(() => {
        if (!cancelled) setRegStatus("unregistered");
      });
    return () => { cancelled = true; };
  }, [shouldCheck, wallet, network]);

  const register = async () => {
    if (!connected) { setVisible(true); return; }
    if (!support.supported) { setRegisterError(support.reason); return; }
    try {
      setRegisterLoading(true);
      setRegisterError(undefined);
      await registerUmbraUser(wallet, network);
      setRegStatus("registered");
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Could not register with Umbra.");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Already registered — show confirmation badge, no button
  if (regStatus === "registered") {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <CheckCircle aria-hidden className="h-4 w-4" weight="fill" />
        Wallet registered with Umbra
      </div>
    );
  }

  // Still checking — show a subtle placeholder so layout doesn't jump
  if (regStatus === "checking") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" />
        Checking registration…
      </div>
    );
  }

  // Not registered (or unknown state) — show the register button
  return (
    <div className="space-y-3">
      <Button
        onClick={register}
        disabled={registerLoading || !isMainnet || (connected && !support.supported)}
        variant="secondary"
      >
        <ShieldCheck aria-hidden className="h-4 w-4" />
        {registerLoading
          ? "Registering…"
          : !isMainnet
            ? "Mainnet only"
            : !connected
              ? "Connect wallet for Umbra"
              : support.supported
                ? "Register wallet with Umbra"
                : "Use a compatible wallet"}
      </Button>
      {!isMainnet && <p className="text-xs text-muted-foreground">Umbra private payments require mainnet. Switch networks to register.</p>}
      {registerError && <p className="text-xs text-destructive">{registerError}</p>}
    </div>
  );
}
