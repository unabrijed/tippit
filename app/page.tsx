import { ArrowRight, ShieldChevron } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { AmbientBackdrop, IconFlow } from "@/components/brand-primitives";
import { MotionSection } from "@/components/motion";

export default function HomePage() {
  return (
    <main className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4">
      <AmbientBackdrop />

      {/* Floating orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(83,115,255,0.12),transparent_70%)] animate-float"
      />

      <MotionSection className="relative flex flex-col items-center gap-10 text-center">
        {/* Logo mark */}
        <div className="icon-circle-lg animate-pulse-soft">
          <ShieldChevron className="h-8 w-8" weight="duotone" />
        </div>

        {/* Wordmark */}
        <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-7xl">
          Tippit
        </h1>

        {/* Tagline */}
        <p className="text-lg font-medium text-muted-foreground">
          Private tips. Simple.
        </p>

        {/* CTA */}
        <ButtonLink href="/create" size="lg" className="gap-2">
          Create a link
          <ArrowRight aria-hidden className="h-4 w-4" />
        </ButtonLink>

        {/* Visual flow */}
        <IconFlow className="mt-4 opacity-60" />
      </MotionSection>
    </main>
  );
}
