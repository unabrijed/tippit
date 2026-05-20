import { cn } from "@/lib/utils";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "flex min-h-[100px] w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:border-accent/40 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-40",
        props.className
      )}
    />
  );
}
