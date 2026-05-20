import { cn } from "@/lib/utils";
import { ArrowRight, ShieldCheck, Wallet } from "@phosphor-icons/react/dist/ssr";

/* ── Ambient backdrop — single soft glow, no clutter ── */

export function AmbientBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute inset-x-0 top-[-12rem] h-[28rem] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(83,115,255,0.1),transparent_70%)]" />
    </div>
  );
}

/* ── Section eyebrow — tiny uppercase label ── */

export function SectionEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

/* ── Section heading — short title only, no copy ── */

export function SectionHeading({
  title,
  icon: Icon,
  align = "left",
  className
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string; weight?: string }>;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", align === "center" && "justify-center", className)}>
      {Icon ? (
        <span className="icon-circle-sm">
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {title}
      </h1>
    </div>
  );
}

/* ── Surface — clean frosted card ── */

export function Surface({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("glass-card", className)}>
      {children}
    </div>
  );
}

/* ── MetricTile — icon + big number, no labels ── */

export function MetricTile({
  value,
  icon: Icon,
  className
}: {
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Surface className={cn("flex flex-col items-center justify-center gap-3 p-6", className)}>
      <div className="text-4xl font-semibold tracking-tight text-foreground">{value}</div>
      {Icon ? (
        <span className="icon-circle-sm">
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
    </Surface>
  );
}

/* ── IconFlow — 3-step visual flow (replaces PrivacyDiagram + VisualRail) ── */

export function IconFlow({ className }: { className?: string }) {
  const steps = [
    { icon: Wallet, label: "Send" },
    { icon: ShieldCheck, label: "Route" },
    { icon: ArrowRight, label: "Claim" }
  ];

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {steps.map((step, i) => (
        <div key={step.label} className="contents">
          <div className="flex flex-col items-center gap-1.5">
            <span className="icon-circle-sm">
              <step.icon className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 ? (
            <div className="h-px w-8 bg-gradient-to-r from-accent/30 to-accent/5" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ── StatusDot — colored circle, no text ── */

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500",
    confirmed: "bg-emerald-500",
    paid: "bg-emerald-500",
    claimed: "bg-slate-400",
    claimable: "bg-accent",
    pending: "bg-amber-400",
    awaiting_signature: "bg-amber-400",
    submitted: "bg-amber-400",
    created: "bg-blue-400",
    expired: "bg-slate-300",
    failed: "bg-destructive",
    cancelled: "bg-destructive",
    draft: "bg-slate-300",
  };

  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full", colors[status] ?? "bg-slate-300", className)}
      title={status.replace(/_/g, " ")}
    />
  );
}
