import dynamic from "next/dynamic";
import { SolanaWalletProvider } from "@/components/solana-wallet-provider";

const CreateLinkForm = dynamic(
  () => import("@/components/create-link-form").then((m) => m.CreateLinkForm),
  { ssr: false, loading: () => <div className="mx-auto h-[480px] max-w-lg animate-pulse rounded-2xl border border-border bg-white/60" /> }
);

export default function CreatePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10 md:py-16">
      <SolanaWalletProvider>
        <CreateLinkForm />
      </SolanaWalletProvider>
    </main>
  );
}
