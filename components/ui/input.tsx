import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "flex min-h-[52px] w-full rounded-md border border-border bg-input px-4 py-3 text-sm text-foreground shadow-none outline-none placeholder:text-ghost-veil focus-visible:border-ghost-mist focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    />
  );
}
