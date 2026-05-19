import { z } from "zod";

export const paymentIntentSchema = z.object({
  paymentLinkId: z.string().min(1),
  payerWallet: z.string().min(20).optional(),
  amount: z.coerce.number().positive(),
  tokenType: z.enum(["USDC", "SOL"]).optional(),
  tokenMint: z.string().min(20).optional()
});
