import type { AppNetwork } from "@/lib/network";
import { getMagicBlockApiBase, getMagicBlockCluster } from "@/lib/magicblock/constants";

export async function magicBlockFetch<T>(path: string, options?: RequestInit & { network?: AppNetwork; token?: string }) {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");
  if (options?.token) headers.set("Authorization", `Bearer ${options.token}`);

  const response = await fetch(`${getMagicBlockApiBase()}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  let data: T | { error?: string; message?: string } | null = null;
  try {
    data = (await response.json()) as T | { error?: string; message?: string };
  } catch {
    if (!response.ok) {
      throw new Error(`MagicBlock request failed: ${response.status}`);
    }
  }

  if (!response.ok) {
    const errData = data as { error?: string; message?: string } | null;
    const message = errData?.error || errData?.message || `MagicBlock request failed: ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export function withCluster(network: AppNetwork, payload?: Record<string, unknown>) {
  return {
    ...(payload ?? {}),
    cluster: getMagicBlockCluster(network)
  };
}
