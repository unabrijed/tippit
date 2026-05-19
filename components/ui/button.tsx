import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary text-primary-foreground border-transparent hover:brightness-110 dark:hover:brightness-95",
  secondary: "border border-ghost-pine bg-transparent text-ghost-pine hover:bg-ghost-pine/5 dark:border-ghost-ivory dark:text-ghost-ivory dark:hover:bg-ghost-ivory/10",
  ghost: "border border-border bg-transparent text-ghost-smoke hover:bg-card hover:text-ghost-pine dark:hover:bg-white/5 dark:hover:text-ghost-ivory",
  danger: "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 dark:border-destructive/40 dark:text-destructive-foreground dark:hover:bg-destructive/20"
} as const;

const sizes = {
  default: "min-h-12 px-5 py-3 text-sm",
  lg: "min-h-[52px] px-6 py-3.5 text-sm",
  sm: "min-h-10 px-4 py-2 text-sm"
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ className, variant = "primary", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition duration-200 ease-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

type LinkProps = React.ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
};

export function ButtonLink({ className, variant = "primary", size = "default", ...props }: LinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition duration-200 ease-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
