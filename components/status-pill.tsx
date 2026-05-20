import { cn } from "@/lib/utils";

export function StatusPill({ status, children }: { status: string; children?: React.ReactNode }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-200",
    paid: "bg-emerald-50 text-emerald-600 border-emerald-200",
    confirmed: "bg-emerald-50 text-emerald-600 border-emerald-200",
    claimable: "bg-accent-soft text-accent border-accent/20",
    claimed: "bg-slate-50 text-slate-500 border-slate-200",
    expired: "bg-slate-50 text-slate-400 border-slate-200",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    draft: "bg-slate-50 text-slate-500 border-slate-200",
    created: "bg-blue-50 text-blue-600 border-blue-200",
    awaiting_signature: "bg-amber-50 text-amber-600 border-amber-200",
    submitted: "bg-amber-50 text-amber-600 border-amber-200",
  };

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-wider",
        styles[status] ?? "bg-slate-50 text-slate-500 border-slate-200"
      )}
    >
      {children ?? status.replace(/_/g, " ")}
    </span>
  );
}
