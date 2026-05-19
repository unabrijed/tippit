import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-ghost-mist/20 after:absolute after:inset-0 after:animate-shimmer after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)] after:content-[''] dark:bg-white/10",
        className
      )}
      aria-hidden
    />
  );
}
