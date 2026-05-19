import { NETWORK_HEADER, type AppNetwork } from "@/lib/network";

export function withNetworkHeaders(init: RequestInit | undefined, network: AppNetwork): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set(NETWORK_HEADER, network);
  return { ...init, headers };
}
