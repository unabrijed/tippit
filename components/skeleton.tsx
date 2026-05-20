import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-white/70 bg-white/60 after:absolute after:inset-0 after:animate-shimmer after:bg-[linear-gradient(90deg,transparent,rgba(83,115,255,0.08),transparent)] after:content-['']",
        className
      )}
      aria-hidden
    />
  );
}
