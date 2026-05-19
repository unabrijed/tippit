import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Ghost } from "@phosphor-icons/react/dist/ssr";

export function EmptyState({ title, copy, href, cta }: { title: string; copy: string; href?: string; cta?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ghost-pine/10 text-ghost-pine dark:bg-ghost-ivory/10 dark:text-ghost-ivory">
        <Ghost aria-hidden className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-semibold text-ghost-ink dark:text-ghost-ivory">{title}</p>
        <p className="max-w-md text-sm leading-6 text-ghost-smoke dark:text-[#C9C1B8]">{copy}</p>
      </div>
      {href && cta ? <ButtonLink href={href} variant="secondary">{cta}</ButtonLink> : null}
      {!href && cta ? <Link href="/create" className="text-sm font-medium text-ghost-pine underline-offset-4 hover:underline">{cta}</Link> : null}
    </div>
  );
}
