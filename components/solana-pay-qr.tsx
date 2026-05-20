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
  const [show, setShow] = useState(false);
  const { network } = useNetwork();

  useEffect(() => {
    let active = true;
    fetch(`/api/solana-pay/${slug}`, withNetworkHeaders(undefined, network))
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          if (active) setState({ error: data.error ?? "QR unavailable.", checkoutUrl: data.checkoutUrl });
          return;
        }
        if (active) setState({ url: data.url, checkoutUrl: data.checkoutUrl });
      })
      .catch((error) => {
        if (active) setState({ error: error instanceof Error ? error.message : "QR unavailable." });
      });

    return () => {
      active = false;
    };
  }, [network, slug]);

  if (state.error) {
    if (!state.checkoutUrl) return null;
    return (
      <a
        href={state.checkoutUrl}
        className="flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Open checkout to send with Umbra
        <ArrowSquareOut className="h-3.5 w-3.5" />
      </a>
    );
  }

  if (!state.url) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="icon-circle text-accent transition hover:bg-accent/15"
        aria-label={show ? "Hide QR" : "Show QR"}
      >
        <QrCode className="h-5 w-5" weight={show ? "fill" : "regular"} />
      </button>

      {show ? (
        <div className="animate-scale-in rounded-2xl border border-border bg-white p-4 shadow-soft">
          <QRCodeSVG value={state.url} size={160} includeMargin />
        </div>
      ) : null}
    </div>
  );
}
