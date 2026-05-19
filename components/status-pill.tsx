import { cn } from "@/lib/utils";
import type { LinkStatus, PaymentStatus } from "@/lib/types";

const styles: Record<PaymentStatus | LinkStatus, string> = {
  active: "border-ghost-pine/30 bg-ghost-pine/10 text-ghost-pine dark:bg-ghost-ivory/10 dark:text-ghost-ivory",
  draft: "border-border bg-ghost-cream text-ghost-smoke dark:bg-white/5 dark:text-[#D4CEC6]",
  paid: "border-ghost-sage/40 bg-ghost-sage/15 text-[#2C5A4A] dark:text-[#C7E1D7]",
  expired: "border-border bg-ghost-cream text-ghost-veil dark:bg-white/5",
  cancelled: "border-destructive/20 bg-destructive/10 text-destructive",
  created: "border-ghost-gold/40 bg-ghost-gold/15 text-[#8A6A30]",
  awaiting_signature: "border-ghost-gold/40 bg-ghost-gold/15 text-[#8A6A30]",
  submitted: "border-ghost-gold/40 bg-ghost-gold/15 text-[#8A6A30]",
  confirmed: "border-ghost-pine/30 bg-ghost-pine/10 text-ghost-pine dark:bg-ghost-ivory/10 dark:text-ghost-ivory",
  claimable: "border-ghost-sage/40 bg-ghost-sage/15 text-[#2C5A4A] dark:text-[#C7E1D7]",
  claimed: "border-ghost-sand/50 bg-ghost-sand/20 text-ghost-smoke dark:text-[#E2D5C1]",
  failed: "border-destructive/30 bg-destructive/10 text-destructive"
};

export function StatusPill({ status, children }: { status: PaymentStatus | LinkStatus; children?: React.ReactNode }) {
  return (
    <span className={cn("inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-medium uppercase tracking-[0.18em]", styles[status])}>
      {children ?? status.replace(/_/g, " ")}
    </span>
  );
}
