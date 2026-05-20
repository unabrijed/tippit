import type { Wallet } from "@solana/wallet-adapter-react";
import { getAppEnv } from "@/lib/env";
import type { AppNetwork } from "@/lib/network";
import { DEFAULT_USDC_DECIMALS } from "@/lib/solana/tokens";
import { getUmbraWalletSupport } from "@/lib/umbra/wallet";

type ProgressCallback = (message: string) => void;

function toSubscriptionsUrl(rpcUrl: string) {
  if (rpcUrl.startsWith("https://")) return rpcUrl.replace("https://", "wss://");
  if (rpcUrl.startsWith("http://")) return rpcUrl.replace("http://", "ws://");
  return rpcUrl;
}

function toAtomicAmount(amount: number) {
  return BigInt(Math.round(amount * 10 ** DEFAULT_USDC_DECIMALS));
}

function normalizeUmbraError(error: unknown) {
  const message = error instanceof Error ? error.message : "Umbra operation failed.";
  if (message.includes("Wallet Standard")) return "Your wallet does not expose the signing features Umbra needs. Try Phantom or Solflare in browser mode.";
  if (message.includes("User rejected") || message.includes("declined") || message.includes("rejected")) return "The wallet request was cancelled.";
  if (message.includes("No matching private payment")) return message.replaceAll("private payment", "private tip");
  if (message.includes("fetch") || message.includes("network")) return "Umbra network services were unreachable. Check RPC, indexer, or relayer configuration and try again.";
  return message;
}

async function getUmbraDeps() {
  const sdk = await import("@umbra-privacy/sdk");
  const prover = await import("@umbra-privacy/web-zk-prover");
  return { sdk, prover };
}

function getStandardWalletAccount(wallet: Wallet | null) {
  const support = getUmbraWalletSupport(wallet);
  if (!support.supported) {
    throw new Error(support.reason ?? "This wallet does not expose the Wallet Standard features Umbra requires.");
  }

  const adapter = wallet?.adapter as any;
  const standardWallet = adapter?.wallet;
  const account = standardWallet?.accounts?.[0];
  if (!adapter?.standard || !standardWallet || !account) {
    throw new Error("This wallet does not expose the Wallet Standard features Umbra requires.");
  }
  return { standardWallet, account };
}

async function getClient(wallet: Wallet | null, network: AppNetwork) {
  const { sdk, prover } = await getUmbraDeps();
  const { standardWallet, account } = getStandardWalletAccount(wallet);
  const signer = sdk.createSignerFromWalletAccount(standardWallet, account);
  const appEnv = getAppEnv(network);
  const rpcUrl = appEnv.rpcUrl;
  const client = await sdk.getUmbraClient({
    signer,
    network: appEnv.umbraNetwork,
    rpcUrl,
    rpcSubscriptionsUrl: toSubscriptionsUrl(rpcUrl),
    indexerApiEndpoint: appEnv.umbraIndexerApiEndpoint
  });
  return { sdk, prover, signer, client };
}

export async function registerUmbraUser(wallet: Wallet | null, network: AppNetwork, onProgress?: ProgressCallback) {
  try {
    onProgress?.("Preparing Umbra wallet registration…");
    const { sdk, prover, client } = await getClient(wallet, network);
    const register = sdk.getUserRegistrationFunction(
      { client },
      { zkProver: prover.getUserRegistrationProver() }
    );
    const result = await register({ confidential: true, anonymous: true });
    onProgress?.("Umbra registration ready.");
    return result;
  } catch (error) {
    throw new Error(normalizeUmbraError(error));
  }
}

export async function createPrivatePayment(wallet: Wallet | null, args: { receiverAddress: string; mint: string; amount: number; network: AppNetwork }, onProgress?: ProgressCallback) {
  try {
    const { sdk, prover, client } = await getClient(wallet, args.network);

    await registerUmbraUser(wallet, args.network, onProgress);
    onProgress?.("Generating private tip proof…");

    const createUtxo = sdk.getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
      { client },
      {
        zkProver: prover.getCreateReceiverClaimableUtxoFromPublicBalanceProver({
          callbacks: {
            onStart: () => onProgress?.("Creating receiver-claimable private UTXO…"),
            onComplete: () => onProgress?.("Submitting private tip transaction…")
          } as any
        })
      }
    );

    const result = await createUtxo(
      {
        destinationAddress: args.receiverAddress as any,
        mint: args.mint as any,
        amount: toAtomicAmount(args.amount) as any
      },
      {}
    );

    onProgress?.("Private tip submitted.");
    return result;
  } catch (error) {
    throw new Error(normalizeUmbraError(error));
  }
}

function pickBestClaimCandidate(candidates: any[], receiverAddress: string, amount: number) {
  const targetAmount = toAtomicAmount(amount).toString();
  const exact = candidates.filter((item) => item.destinationAddress === receiverAddress && item.amount.toString() === targetAmount);
  if (exact.length === 0) return null;
  return exact.sort((a, b) => Number(b.insertionIndex ?? 0) - Number(a.insertionIndex ?? 0))[0];
}

function extractClaimSignature(result: any) {
  const signatureGroups = Object.values(result?.signatures ?? {});
  const flattened = signatureGroups.flatMap((item: any) => Array.isArray(item) ? item : [item]);
  return flattened.find(Boolean) as string | undefined;
}

export async function claimLatestPrivatePayment(wallet: Wallet | null, args: { receiverAddress: string; amount: number; network: AppNetwork }, onProgress?: ProgressCallback) {
  try {
    const { sdk, prover, client } = await getClient(wallet, args.network);
    const appEnv = getAppEnv(args.network);
    const relayer = sdk.getUmbraRelayer({ apiEndpoint: appEnv.umbraRelayerApiEndpoint });

    await registerUmbraUser(wallet, args.network, onProgress);
    onProgress?.("Scanning Umbra claimable payments…");

    const scan = sdk.getClaimableUtxoScannerFunction({ client });
    const scanned = await scan(0 as any, 0 as any, 256 as any);
    const candidates = [...(scanned.publicReceived ?? []), ...(scanned.received ?? [])];
    const target = pickBestClaimCandidate(candidates, args.receiverAddress, args.amount);
    if (!target) {
      throw new Error("No matching private tip was found to claim yet.");
    }

    // SDK v4+: fetchBatchMerkleProof is available directly on the client (populated
    // automatically when indexerApiEndpoint is supplied to getUmbraClient)
    const fetchBatchMerkleProof = (client as any).fetchBatchMerkleProof;
    if (!fetchBatchMerkleProof) {
      throw new Error("Indexer not configured — supply NEXT_PUBLIC_UMBRA_INDEXER_API_ENDPOINT to enable private claims.");
    }

    const claim = sdk.getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
      { client },
      {
        fetchBatchMerkleProof,
        zkProver: prover.getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver({
          callbacks: {
            onStart: () => onProgress?.("Generating claim proof…"),
            onComplete: () => onProgress?.("Submitting private claim via relayer…")
          } as any
        }),
        relayer
      }
    );

    const result = await claim([target]);
    onProgress?.("Private claim submitted.");
    return {
      result,
      claimSignature: extractClaimSignature(result)
    };
  } catch (error) {
    throw new Error(normalizeUmbraError(error));
  }
}
