"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { withNetworkHeaders } from "@/lib/network-request";
import { useNetwork } from "@/components/network-provider";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

export function CreateCreatorForm() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { network } = useNetwork();
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [defaultRail, setDefaultRail] = useState<"magicblock" | "umbra">("magicblock");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const finalSlug = useMemo(() => slug || slugify(displayName), [displayName, slug]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) {
      setVisible(true);
      setError("Connect your creator wallet first.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessUrl(null);

    try {
      const response = await fetch("/api/creators", withNetworkHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          displayName,
          slug: finalSlug,
          bio,
          defaultRail
        })
      }, network));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create creator page.");
      setSuccessUrl(data.pageUrl);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not create creator page.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-card/90 shadow-soft">
      <CardContent className="space-y-6 p-6 md:p-8">
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="text-sm font-medium">Display name</label>
            <Input id="displayName" autoComplete="nickname" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Aanya Studio" required maxLength={60} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="slug" className="text-sm font-medium">Public handle</label>
            <Input id="slug" autoComplete="off" spellCheck={false} value={slug} onChange={(event) => setSlug(slugify(event.target.value))} placeholder="aanya-studio" required maxLength={32} />
            <p className="text-xs text-muted-foreground">Your page will live at /@{finalSlug || "your-handle"}.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bio" className="text-sm font-medium">Bio</label>
            <Textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Private tips for photoshoots, set builds, and behind-the-scenes work." maxLength={280} />
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-1.5">
              <label htmlFor="defaultRail" className="text-sm font-medium">Default protocol</label>
              <Select id="defaultRail" value={defaultRail} onChange={(event) => setDefaultRail(event.target.value as "magicblock" | "umbra")}>
                <option value="magicblock">MagicBlock</option>
                <option value="umbra">Umbra</option>
              </Select>
              <p className="text-xs text-muted-foreground">This controls the default private checkout protocol on your creator page.</p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{defaultRail === "magicblock" ? "MagicBlock selected" : "Umbra selected"}</p>
              <p className="mt-1">
                {defaultRail === "magicblock"
                  ? "Fans sign a MagicBlock transfer. MagicBlock stays the default and unlock tools remain available in the dashboard."
                  : "Fans use Umbra private checkout. Tips are still recorded to this wallet and show up in dashboard activity."}
              </p>
            </div>
          </div>

          {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
          {successUrl ? <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">Creator page ready. Visit <a className="underline" href={successUrl}>{successUrl}</a>.</div> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={submitting || !connected || !displayName || !finalSlug} aria-busy={submitting}>
              {submitting ? "Creating page..." : "Create creator page"}
            </Button>
            {!connected ? <Button type="button" variant="secondary" onClick={() => setVisible(true)}>Connect wallet</Button> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
