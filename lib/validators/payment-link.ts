import { z } from "zod";

export const paymentLinkSchema = z.object({
  title: z.string().min(3, "Add a clear payment title."),
  description: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  tokenType: z.enum(["USDC", "SOL"]).default("USDC"),
  tokenMint: z.string().min(20, "Provide a valid token mint.").optional(),
  privacyMode: z.enum(["umbra_utxo", "public_transfer"]).optional(),
  linkType: z.enum(["one_time", "reusable"]).default("one_time"),
  expiresAt: z.string(),
  receiverWallet: z.string().min(20, "Connect a valid receiver wallet."),
  displayName: z.string().optional()
}).superRefine((value, ctx) => {
  if (value.tokenType === "USDC" && !value.tokenMint) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tokenMint"], message: "Provide a valid USDC mint." });
  }
  if (value.tokenType === "USDC" && value.privacyMode === "public_transfer") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["privacyMode"], message: "USDC links must use Umbra private payments." });
  }
});
