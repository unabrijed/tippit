import { NextResponse } from "next/server";
import { confirmTipSchema } from "@/lib/tippit/validators";
import { markTipConfirmed } from "@/lib/tippit/store";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = confirmTipSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid confirmation payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const tip = await markTipConfirmed(parsed.data.clientRefId, parsed.data.txSignature);
  if (!tip) {
    return NextResponse.json({ error: "Tip not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, tip });
}
