import { NextResponse } from "next/server";
import { getCreatorBySlug } from "@/lib/tippit/store";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const creator = await getCreatorBySlug(params.slug);
  if (!creator) {
    return NextResponse.json({ error: "Creator not found." }, { status: 404 });
  }

  return NextResponse.json({ creator });
}
