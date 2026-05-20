import { NextResponse } from "next/server";
import { upsertCreatorProfile, getCreatorByWallet } from "@/lib/tippit/store";
import { creatorProfileSchema } from "@/lib/tippit/validators";
import { persistCreatorSlug } from "@/lib/tippit/cookies";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ creator: null });
  const creator = await getCreatorByWallet(wallet);
  return NextResponse.json({ creator });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = creatorProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid creator profile.", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const creator = await upsertCreatorProfile(parsed.data);
    persistCreatorSlug(creator.slug);

    return NextResponse.json({
      creator,
      pageUrl: `/@${creator.slug}`,
      checkoutUrl: `/tip/${creator.slug}`
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save creator profile.";
    const status = message.includes("already taken") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
