import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-accent text-white shadow-[0_4px_16px_rgba(83,115,255,0.25)] hover:bg-[#4563e8] active:bg-[#3a56d4]",
  secondary:
    "border border-border bg-white text-foreground hover:bg-muted active:bg-slate-100",
  ghost:
    "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
  danger:
    "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15",
  icon:
    "bg-accent-soft text-accent hover:bg-accent/15 active:bg-accent/20"
} as const;

const sizes = {
  default: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-sm",
  sm: "min-h-9 px-3.5 py-2 text-sm",
  icon: "h-10 w-10 p-0"
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

const shared =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] transition-all duration-200 ease-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]";

export function Button({ className, variant = "primary", size = "default", ...props }: ButtonProps) {
  return <button className={cn(shared, variants[variant], sizes[size], className)} {...props} />;
}

type LinkProps = React.ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
};

export function ButtonLink({ className, variant = "primary", size = "default", ...props }: LinkProps) {
  return <Link className={cn(shared, variants[variant], sizes[size], className)} {...props} />;
}
