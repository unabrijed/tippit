import { NextResponse } from "next/server";
import { getNetworkFromRequest } from "@/lib/network";
import { createPaymentIntent } from "@/lib/db/store";
import { paymentIntentSchema } from "@/lib/validators/payment-intent";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = paymentIntentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment intent payload." }, { status: 400 });
  }

  try {
    const network = getNetworkFromRequest(request);
    const intent = await createPaymentIntent({ ...parsed.data, network });
    return NextResponse.json(intent, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create payment intent." }, { status: 400 });
  }
}
