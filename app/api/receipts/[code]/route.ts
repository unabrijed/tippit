import { NextResponse } from "next/server";
import { getReceiptByCode } from "@/lib/db/store";

export async function GET(_: Request, { params }: { params: { code: string } }) {
  const receipt = await getReceiptByCode(params.code);
  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  }
  return NextResponse.json(receipt);
}
