import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";

export function EmptyState({ title, href, cta }: { title: string; copy?: string; href?: string; cta?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white/50 py-12 text-center">
      <span className="icon-circle">
        <Sparkle aria-hidden className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {href && cta ? <ButtonLink href={href} variant="secondary" size="sm">{cta}</ButtonLink> : null}
    </div>
  );
}
