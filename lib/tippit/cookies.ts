import { cookies } from "next/headers";
import { CREATOR_SLUG_COOKIE, CREATOR_WALLET_COOKIE, MAGICBLOCK_TOKEN_COOKIE } from "@/lib/tippit/constants";

export function getCreatorSession() {
  const store = cookies();
  return {
    walletAddress: store.get(CREATOR_WALLET_COOKIE)?.value,
    token: store.get(MAGICBLOCK_TOKEN_COOKIE)?.value,
    slug: store.get(CREATOR_SLUG_COOKIE)?.value
  };
}

export function persistCreatorSession(input: { walletAddress: string; token: string; slug?: string }) {
  const store = cookies();
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  };

  store.set(CREATOR_WALLET_COOKIE, input.walletAddress, baseOptions);
  store.set(MAGICBLOCK_TOKEN_COOKIE, input.token, baseOptions);
  if (input.slug) {
    store.set(CREATOR_SLUG_COOKIE, input.slug, { ...baseOptions, httpOnly: false });
  }
}

export function persistCreatorSlug(slug: string) {
  cookies().set(CREATOR_SLUG_COOKIE, slug, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearCreatorSession() {
  const store = cookies();
  store.delete(MAGICBLOCK_TOKEN_COOKIE);
  store.delete(CREATOR_WALLET_COOKIE);
}
