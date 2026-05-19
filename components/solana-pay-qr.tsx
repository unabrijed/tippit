"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowSquareOut, QrCode } from "@phosphor-icons/react";
import { useNetwork } from "@/components/network-provider";
import { withNetworkHeaders } from "@/lib/network-request";

type State = {
  url?: string;
  checkoutUrl?: string;
  error?: string;
};

export function SolanaPayQr({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({});
  const { network } = useNetwork();

  useEffect(() => {
    let active = true;
    fetch(`/api/solana-pay/${slug}`, withNetworkHeaders(undefined, network))
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load Solana Pay QR.");
        if (active) setState({ url: data.url, checkoutUrl: data.checkoutUrl });
      })
      .catch((error) => {
        if (active) setState({ error: error instanceof Error ? error.message : "Could not load Solana Pay QR." });
      });

    return () => {
      active = false;
    };
  }, [network, slug]);

  if (state.error) {
    return <p className="text-xs text-ghost-smoke dark:text-[#C9C1B8]">{state.error}</p>;
  }

  if (!state.url) {
    return <p className="text-xs text-ghost-smoke dark:text-[#C9C1B8]">Preparing Solana Pay QR…</p>;
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background/60 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-ghost-ink dark:text-ghost-ivory">
        <QrCode aria-hidden className="h-4 w-4" />
        Solana Pay transfer QR
      </div>
      <div className="inline-flex rounded-lg bg-white p-3">
        <QRCodeSVG value={state.url} size={148} includeMargin />
      </div>
      <div className="space-y-2 text-xs text-ghost-smoke dark:text-[#C9C1B8]">
        <p>Wallets can scan this QR to open a direct Solana Pay transfer for this link.</p>
        <a href={state.url} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 py-2 font-medium text-ghost-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Open Solana Pay link
          <ArrowSquareOut aria-hidden className="h-4 w-4" />
        </a>
        {state.checkoutUrl ? <p className="mono-address break-all">Web checkout: {state.checkoutUrl}</p> : null}
      </div>
    </div>
  );
}
