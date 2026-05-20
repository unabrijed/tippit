import { cn } from "@/lib/utils";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "flex min-h-11 w-full appearance-none rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground outline-none focus-visible:border-accent/40 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-40",
        props.className
      )}
    />
  );
}
