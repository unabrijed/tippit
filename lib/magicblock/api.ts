import type { AppNetwork } from "@/lib/network";
import { getMagicBlockApiBase, getMagicBlockCluster } from "@/lib/magicblock/constants";

export async function magicBlockFetch<T>(path: string, options?: RequestInit & { network?: AppNetwork; token?: string }) {
  const base = getMagicBlockApiBase();
  const url = `${base}${path}`;
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");
  const hasToken = !!options?.token;
  if (hasToken) headers.set("Authorization", `Bearer ${options!.token}`);

  console.log("[magicblock] →", options?.method ?? "GET", url, { hasToken, body: options?.body });

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store"
  });

  let data: T | Record<string, unknown> | null = null;
  try {
    data = (await response.json()) as T | Record<string, unknown>;
  } catch {
    console.error("[magicblock] ← %s %s — empty/non-JSON body", response.status, url);
    if (!response.ok) {
      throw new Error(`MagicBlock request failed: ${response.status}`);
    }
  }

  console.log("[magicblock] ←", response.status, url, JSON.stringify(data));

  if (!response.ok) {
    const errData = data as Record<string, unknown> | null;
    const raw = errData?.error ?? errData?.message ?? errData?.detail;
    const message = typeof raw === "string"
      ? raw
      : raw != null
        ? JSON.stringify(raw)
        : `MagicBlock request failed: ${response.status} — ${JSON.stringify(errData)}`;
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
