import { notFound } from "next/navigation";
import { getCreatorBySlug, listTipsByCreator } from "@/lib/tippit/store";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { User } from "@phosphor-icons/react/dist/ssr";

export default async function CreatorPage({ params }: { params: { slug: string } }) {
  const creator = await getCreatorBySlug(params.slug);
  if (!creator) notFound();

  const tips = (await listTipsByCreator(creator.id)).filter((tip) => tip.paymentStatus === "confirmed" && tip.visibility === "public").slice(0, 6);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-10 md:py-16">
      {/* Profile */}
      <Card>
        <CardContent className="flex flex-col items-center gap-5 py-10">
          <span className="icon-circle-lg">
            <User className="h-7 w-7" weight="duotone" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{creator.displayName}</h1>
          <ButtonLink href={`/tip/${creator.slug}`} size="lg">
            Send a tip
          </ButtonLink>
        </CardContent>
      </Card>

      {/* Public notes */}
      {tips.length > 0 ? (
        <div className="space-y-2">
          {tips.map((tip) => (
            <div key={tip.id} className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
              <span className="text-sm font-semibold text-foreground">{tip.amountUi.toFixed(2)} {tip.tokenSymbol}</span>
              {tip.message ? (
                <p className="flex-1 truncate text-sm text-muted-foreground">"{tip.message}"</p>
              ) : (
                <span className="flex-1" />
              )}
              <span className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(tip.confirmedAt || tip.createdAt))}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </main>
  );
}
