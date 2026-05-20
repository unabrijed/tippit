import type { AppNetwork } from "@/lib/network";
import { magicBlockFetch, withCluster } from "@/lib/magicblock/api";

export async function getMagicBlockChallenge(pubkey: string, network: AppNetwork) {
  const search = new URLSearchParams({
    pubkey,
    cluster: network === "mainnet" ? "mainnet" : "devnet"
  });
  return magicBlockFetch<{ challenge: string }>(`/v1/spl/challenge?${search.toString()}`);
}

export async function loginToMagicBlock(input: {
  pubkey: string;
  challenge: string;
  signature: string;
  network: AppNetwork;
}) {
  return magicBlockFetch<{ token: string }>("/v1/spl/login", {
    method: "POST",
    body: JSON.stringify(withCluster(input.network, {
      pubkey: input.pubkey,
      challenge: input.challenge,
      signature: input.signature
    }))
  });
}
