import type { PaymentLinkRecord } from "@/lib/types";

export function getSolanaPayTransferUrl(link: PaymentLinkRecord) {
  const url = new URL(`solana:${link.receiverWallet}`);
  url.searchParams.set("amount", String(link.amount));
  if (link.tokenType === "USDC" && link.tokenMint) {
    url.searchParams.set("spl-token", link.tokenMint);
  }
  url.searchParams.set("label", `${link.displayName} · Tippit`);
  url.searchParams.set("message", link.title);
  url.searchParams.set("memo", `tippit:${link.slug}`);
  return url.toString();
}

export function getTippitCheckoutUrl(link: PaymentLinkRecord) {
  return `/pay/${link.slug}`;
}
