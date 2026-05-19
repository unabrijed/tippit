import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEFAULT_USDC_SYMBOL, getDefaultUsdcMint } from "@/lib/solana/tokens";
import type { SupportedToken } from "@/lib/solana/tokens";
import { slugify } from "@/lib/format";
import { appEnv } from "@/lib/env";
import { DEFAULT_APP_NETWORK, type AppNetwork } from "@/lib/network";
import { getValkeyClient } from "@/lib/valkey/client";
import type { DashboardPayload, LinkStatus, MerchantRecord, PaymentIntentRecord, PaymentLinkRecord, ReceiptRecord } from "@/lib/types";

type EventRecord = {
  id: string;
  paymentIntentId: string;
  eventType: string;
  eventPayload?: Record<string, unknown>;
  createdAt: string;
};

type PaymentLinkInsert = {
  network: AppNetwork;
  title: string;
  description?: string;
  amount: number;
  tokenType: SupportedToken;
  tokenMint?: string;
  linkType: "one_time" | "reusable";
  expiresAt: string;
  receiverWallet: string;
  displayName?: string;
  privacyMode?: "umbra_utxo" | "public_transfer";
};

const now = () => new Date().toISOString();
const addHours = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const merchants = new Map<string, MerchantRecord>();
const paymentLinks = new Map<string, PaymentLinkRecord>();
const paymentIntents = new Map<string, PaymentIntentRecord>();
const receipts = new Map<string, ReceiptRecord>();
const paymentEvents: EventRecord[] = [];
const localStorePath = path.join(process.cwd(), ".ghostpay", "store.json");
let memoryLoaded = false;

type LocalStoreSnapshot = {
  merchants: MerchantRecord[];
  paymentLinks: PaymentLinkRecord[];
  paymentIntents: PaymentIntentRecord[];
  receipts: ReceiptRecord[];
  paymentEvents: EventRecord[];
};

const keys = {
  merchant: (walletAddress: string, network: AppNetwork) => `ghostpay:merchant:${network}:${walletAddress}`,
  paymentLink: (id: string) => `ghostpay:payment-link:${id}`,
  paymentLinkBySlug: (slug: string) => `ghostpay:payment-link:slug:${slug}`,
  paymentLinksByWallet: (walletAddress: string, network: AppNetwork) => `ghostpay:payment-links:wallet:${network}:${walletAddress}`,
  paymentIntent: (id: string) => `ghostpay:payment-intent:${id}`,
  paymentIntentsByWallet: (walletAddress: string, network: AppNetwork) => `ghostpay:payment-intents:wallet:${network}:${walletAddress}`,
  receipt: (code: string) => `ghostpay:receipt:${code}`,
  receiptByPaymentIntent: (paymentIntentId: string) => `ghostpay:receipt:payment-intent:${paymentIntentId}`,
  paymentEvents: "ghostpay:payment-events"
} as const;

function seedMemory() {
  if (merchants.size > 0) return;

  const network: AppNetwork = "mainnet";
  const merchantId = randomUUID();
  const merchant: MerchantRecord = {
    id: merchantId,
    walletAddress: "8x4sPGwX8fYJ89XxVY4jLqZx8sKq9r5Wp7cGpf8F3c2y",
    displayName: "Shoonya Studio",
    network,
    createdAt: now()
  };
  merchants.set(merchant.id, merchant);

  const linkId = randomUUID();
  paymentLinks.set(linkId, {
    id: linkId,
    merchantId,
    receiverWallet: merchant.walletAddress,
    displayName: merchant.displayName,
    slug: "demo-shoonya-design-assignment",
    title: "Shoonya Design Assignment",
    description: "Private design sprint payout for the final handoff.",
    amount: 50,
    tokenType: "USDC",
    tokenMint: getDefaultUsdcMint(network),
    tokenSymbol: DEFAULT_USDC_SYMBOL,
    network,
    linkType: "one_time",
    privacyMode: "public_transfer",
    status: "active",
    expiresAt: addHours(24),
    createdAt: now(),
    updatedAt: now()
  });

  const designAssignmentId = randomUUID();
  paymentLinks.set(designAssignmentId, {
    id: designAssignmentId,
    merchantId,
    receiverWallet: merchant.walletAddress,
    displayName: merchant.displayName,
    slug: "design-assignment-6cae81",
    title: "Design Assignment",
    description: "Private design assignment payout.",
    amount: 50,
    tokenType: "USDC",
    tokenMint: getDefaultUsdcMint(network),
    tokenSymbol: DEFAULT_USDC_SYMBOL,
    network,
    linkType: "one_time",
    privacyMode: "public_transfer",
    status: "active",
    expiresAt: addHours(24),
    createdAt: now(),
    updatedAt: now()
  });

  const demoReceipt: ReceiptRecord = {
    id: randomUUID(),
    paymentIntentId: "demo-payment-intent",
    receiptCode: "demo-gp-82kx",
    status: "issued",
    intentStatus: "claimed",
    amount: 50,
    tokenSymbol: DEFAULT_USDC_SYMBOL,
    network,
    displayName: merchant.displayName,
    createdAt: now()
  };
  receipts.set(demoReceipt.receiptCode, demoReceipt);
}

seedMemory();

function ensureSeedLinksPresent() {
  if (merchants.size === 0) {
    seedMemory();
    return true;
  }

  const existingDesignAssignment = [...paymentLinks.values()].some((link) => link.slug === "design-assignment-6cae81" && link.network === "mainnet");
  if (existingDesignAssignment) {
    return false;
  }

  const merchant = [...merchants.values()].find((item) => item.network === "mainnet");
  if (!merchant) {
    seedMemory();
    return true;
  }

  const id = randomUUID();
  paymentLinks.set(id, {
    id,
    merchantId: merchant.id,
    receiverWallet: merchant.walletAddress,
    displayName: merchant.displayName,
    slug: "design-assignment-6cae81",
    title: "Design Assignment",
    description: "Private design assignment payout.",
    amount: 50,
    tokenType: "USDC",
    tokenMint: getDefaultUsdcMint(merchant.network),
    tokenSymbol: DEFAULT_USDC_SYMBOL,
    network: merchant.network,
    linkType: "one_time",
    privacyMode: "public_transfer",
    status: "active",
    expiresAt: addHours(24),
    createdAt: now(),
    updatedAt: now()
  });
  return true;
}

function normalizeMerchantRecord(merchant: MerchantRecord | (Omit<MerchantRecord, "network"> & { network?: AppNetwork })) : MerchantRecord {
  return { ...merchant, network: merchant.network ?? DEFAULT_APP_NETWORK };
}

function normalizePaymentLinkRecord(link: PaymentLinkRecord | (Omit<PaymentLinkRecord, "network"> & { network?: AppNetwork })) : PaymentLinkRecord {
  return { ...link, network: link.network ?? DEFAULT_APP_NETWORK, tokenType: (link as PaymentLinkRecord).tokenType ?? (((link as PaymentLinkRecord).tokenSymbol as SupportedToken) || "USDC") };
}

function normalizePaymentIntentRecord(intent: PaymentIntentRecord | (Omit<PaymentIntentRecord, "network"> & { network?: AppNetwork })) : PaymentIntentRecord {
  return { ...intent, network: intent.network ?? DEFAULT_APP_NETWORK, tokenType: (intent as PaymentIntentRecord).tokenType ?? (((intent as PaymentIntentRecord).tokenSymbol as SupportedToken) || "USDC") };
}

function normalizeReceiptRecord(receipt: ReceiptRecord | (Omit<ReceiptRecord, "network"> & { network?: AppNetwork })) : ReceiptRecord {
  return { ...receipt, network: receipt.network ?? DEFAULT_APP_NETWORK };
}

function getLocalSnapshot(): LocalStoreSnapshot {
  return {
    merchants: [...merchants.values()],
    paymentLinks: [...paymentLinks.values()],
    paymentIntents: [...paymentIntents.values()],
    receipts: [...receipts.values()],
    paymentEvents: [...paymentEvents]
  };
}

function hydrateMemory(snapshot: LocalStoreSnapshot) {
  merchants.clear();
  paymentLinks.clear();
  paymentIntents.clear();
  receipts.clear();
  paymentEvents.splice(0, paymentEvents.length);

  snapshot.merchants.forEach((merchant) => { const normalized = normalizeMerchantRecord(merchant as MerchantRecord); merchants.set(normalized.id, normalized); });
  snapshot.paymentLinks.forEach((link) => { const normalized = normalizePaymentLinkRecord(link as PaymentLinkRecord); paymentLinks.set(normalized.id, normalized); });
  snapshot.paymentIntents.forEach((intent) => { const normalized = normalizePaymentIntentRecord(intent as PaymentIntentRecord); paymentIntents.set(normalized.id, normalized); });
  snapshot.receipts.forEach((receipt) => { const normalized = normalizeReceiptRecord(receipt as ReceiptRecord); receipts.set(normalized.receiptCode, normalized); });
  paymentEvents.push(...snapshot.paymentEvents);
}

async function persistMemory() {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, JSON.stringify(getLocalSnapshot(), null, 2), "utf8");
}

async function ensureMemoryLoaded() {
  if (getValkeyClient() || memoryLoaded) return;

  try {
    const raw = await readFile(localStorePath, "utf8");
    hydrateMemory(JSON.parse(raw) as LocalStoreSnapshot);
    if (ensureSeedLinksPresent()) {
      await persistMemory();
    }
  } catch {
    merchants.clear();
    paymentLinks.clear();
    paymentIntents.clear();
    receipts.clear();
    paymentEvents.splice(0, paymentEvents.length);
    seedMemory();
    await persistMemory();
  }

  memoryLoaded = true;
}

function enrichLink(link: PaymentLinkRecord): PaymentLinkRecord {
  const isExpired = new Date(link.expiresAt).getTime() < Date.now();
  const nextStatus: LinkStatus = isExpired && link.status === "active" ? "expired" : link.status;
  return { ...link, status: nextStatus, isExpired };
}

async function getJsonValue<T>(key: string) {
  const valkey = getValkeyClient();
  if (!valkey) return null;
  const raw = await valkey.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

async function setJsonValue(key: string, value: unknown) {
  const valkey = getValkeyClient();
  if (!valkey) return;
  await valkey.set(key, JSON.stringify(value));
}

async function getIndexedIds(key: string) {
  return (await getJsonValue<string[]>(key)) ?? [];
}

async function appendIndexedId(key: string, id: string) {
  const existing = await getIndexedIds(key);
  if (!existing.includes(id)) {
    existing.push(id);
    await setJsonValue(key, existing);
  }
}

async function logEvent(paymentIntentId: string, eventType: string, eventPayload?: Record<string, unknown>) {
  await ensureMemoryLoaded();
  const event = { id: randomUUID(), paymentIntentId, eventType, eventPayload, createdAt: now() };
  paymentEvents.push(event);
  const valkey = getValkeyClient();
  if (!valkey) {
    await persistMemory();
    return;
  }
  const events = (await getJsonValue<EventRecord[]>(keys.paymentEvents)) ?? [];
  events.push(event);
  await setJsonValue(keys.paymentEvents, events);
}

export async function upsertMerchant(walletAddress: string, displayName?: string, network: AppNetwork = DEFAULT_APP_NETWORK) {
  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    const existing = [...merchants.values()].find((item) => item.walletAddress === walletAddress && item.network === network);
    if (existing) {
      const next = { ...existing, displayName: displayName || existing.displayName };
      merchants.set(existing.id, next);
      await persistMemory();
      return next;
    }
    const merchant: MerchantRecord = { id: randomUUID(), walletAddress, displayName: displayName || "Ghost merchant", network, createdAt: now() };
    merchants.set(merchant.id, merchant);
    await persistMemory();
    return merchant;
  }

  const existing = await getJsonValue<MerchantRecord>(keys.merchant(walletAddress, network));
  const merchant: MerchantRecord = existing
    ? { ...existing, displayName: displayName || existing.displayName }
    : { id: randomUUID(), walletAddress, displayName: displayName || "Ghost merchant", network, createdAt: now() };
  await setJsonValue(keys.merchant(walletAddress, network), merchant);
  return merchant;
}

export async function createPaymentLink(input: PaymentLinkInsert) {
  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    const merchant = await upsertMerchant(input.receiverWallet, input.displayName, input.network);
    const id = randomUUID();
    const link: PaymentLinkRecord = {
      id,
      merchantId: merchant.id,
      receiverWallet: input.receiverWallet,
      displayName: input.displayName || merchant.displayName,
      slug: `${slugify(input.title)}-${id.slice(0, 6)}`,
      title: input.title,
      description: input.description,
      amount: input.amount,
      tokenType: input.tokenType,
      tokenMint: input.tokenMint,
      tokenSymbol: input.tokenType,
      network: input.network,
      linkType: input.linkType,
      privacyMode: input.privacyMode ?? "public_transfer",
      status: "active",
      expiresAt: input.expiresAt,
      createdAt: now(),
      updatedAt: now()
    };
    paymentLinks.set(id, link);
    await persistMemory();
    return enrichLink(link);
  }

  const merchant = await upsertMerchant(input.receiverWallet, input.displayName, input.network);
  const id = randomUUID();
  const link: PaymentLinkRecord = enrichLink({
    id,
    merchantId: merchant.id,
    receiverWallet: input.receiverWallet,
    displayName: input.displayName || merchant.displayName,
    slug: `${slugify(input.title)}-${randomUUID().slice(0, 6)}`,
    title: input.title,
    description: input.description,
    amount: input.amount,
    tokenType: input.tokenType,
    tokenMint: input.tokenMint,
    tokenSymbol: input.tokenType,
    network: input.network,
    linkType: input.linkType,
    privacyMode: input.privacyMode ?? "public_transfer",
    status: "active",
    expiresAt: input.expiresAt,
    createdAt: now(),
    updatedAt: now()
  });
  await setJsonValue(keys.paymentLink(link.id), link);
  await setJsonValue(keys.paymentLinkBySlug(link.slug), link.id);
  await appendIndexedId(keys.paymentLinksByWallet(link.receiverWallet, link.network), link.id);
  return link;
}

export async function listPaymentLinksByWallet(walletAddress: string, network: AppNetwork = DEFAULT_APP_NETWORK) {
  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    return [...paymentLinks.values()]
      .filter((item) => item.receiverWallet === walletAddress && item.network === network)
      .map(enrichLink)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const ids = await getIndexedIds(keys.paymentLinksByWallet(walletAddress, network));
  const links = await Promise.all(ids.map((id) => getJsonValue<PaymentLinkRecord>(keys.paymentLink(id))));
  return links
    .filter((item): item is PaymentLinkRecord => Boolean(item))
    .map(enrichLink)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPaymentLinkBySlug(slug: string) {
  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    const link = [...paymentLinks.values()].find((item) => item.slug === slug);
    return link ? enrichLink(link) : null;
  }

  const id = await getJsonValue<string>(keys.paymentLinkBySlug(slug));
  if (!id) return null;
  const link = await getJsonValue<PaymentLinkRecord>(keys.paymentLink(id));
  return link ? enrichLink(link) : null;
}

export async function getPaymentLinkById(id: string) {
  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    const link = paymentLinks.get(id);
    return link ? enrichLink(link) : null;
  }

  const link = await getJsonValue<PaymentLinkRecord>(keys.paymentLink(id));
  return link ? enrichLink(link) : null;
}

export async function createPaymentIntent(input: { paymentLinkId: string; payerWallet?: string; amount: number; tokenMint?: string; tokenType?: SupportedToken; network: AppNetwork }) {
  await ensureMemoryLoaded();
  const link = await getPaymentLinkById(input.paymentLinkId);
  if (!link) throw new Error("Payment link not found.");
  if (link.network !== input.network) throw new Error(`This payment link belongs to ${link.network}, but ${input.network} is selected.`);
  if (link.status !== "active") throw new Error("This payment link is not active.");
  if (link.isExpired) throw new Error("This payment link has expired.");

  const valkey = getValkeyClient();
  const id = randomUUID();
  if (!valkey) {
    const intent: PaymentIntentRecord = {
      id,
      paymentLinkId: link.id,
      linkTitle: link.title,
      receiverWallet: link.receiverWallet,
      payerWallet: input.payerWallet,
      amount: input.amount,
      tokenType: link.tokenType,
      tokenMint: link.tokenMint,
      tokenSymbol: link.tokenSymbol,
      network: input.network,
      status: "awaiting_signature",
      createdAt: now(),
      updatedAt: now(),
      expiresAt: addHours(1)
    };
    paymentIntents.set(id, intent);
    await persistMemory();
    await logEvent(id, "payment_intent.created");
    return intent;
  }

  const intent: PaymentIntentRecord = {
    id,
    paymentLinkId: link.id,
    linkTitle: link.title,
    receiverWallet: link.receiverWallet,
    payerWallet: input.payerWallet,
    amount: input.amount,
    tokenType: link.tokenType,
    tokenMint: link.tokenMint,
    tokenSymbol: link.tokenSymbol,
    network: input.network,
    status: "awaiting_signature",
    createdAt: now(),
    updatedAt: now(),
    expiresAt: addHours(1)
  };
  await setJsonValue(keys.paymentIntent(intent.id), intent);
  await appendIndexedId(keys.paymentIntentsByWallet(intent.receiverWallet, intent.network), intent.id);
  await logEvent(intent.id, "payment_intent.created");
  return intent;
}

export async function getPaymentIntentById(id: string) {
  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    return paymentIntents.get(id) ?? null;
  }
  return await getJsonValue<PaymentIntentRecord>(keys.paymentIntent(id));
}

export async function updatePaymentIntent(id: string, patch: Partial<PaymentIntentRecord>) {
  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    const existing = paymentIntents.get(id);
    if (!existing) return null;
    const next = { ...existing, ...patch, updatedAt: now() };
    paymentIntents.set(id, next);
    await persistMemory();
    return next;
  }

  const existing = await getJsonValue<PaymentIntentRecord>(keys.paymentIntent(id));
  if (!existing) return null;
  const next = { ...existing, ...patch, updatedAt: now() };
  await setJsonValue(keys.paymentIntent(id), next);
  return next;
}

export async function markIntentSubmitted(id: string, signature: string) {
  const intent = await updatePaymentIntent(id, { status: "submitted", solanaSignature: signature });
  if (intent) await logEvent(id, "payment_intent.submitted", { signature });
  return intent;
}

export async function markIntentClaimable(id: string, signature: string, umbraUtxoCommitment?: string) {
  const intent = await updatePaymentIntent(id, { status: "claimable", solanaSignature: signature, umbraUtxoCommitment });
  if (!intent) return null;

  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    const link = paymentLinks.get(intent.paymentLinkId);
    if (link && link.linkType === "one_time") {
      paymentLinks.set(link.id, { ...link, status: "paid", updatedAt: now() });
      await persistMemory();
    }
  } else {
    const link = await getJsonValue<PaymentLinkRecord>(keys.paymentLink(intent.paymentLinkId));
    if (link && link.linkType === "one_time") {
      await setJsonValue(keys.paymentLink(link.id), { ...link, status: "paid", updatedAt: now() });
    }
  }

  await logEvent(id, "payment_intent.claimable", { signature, umbraUtxoCommitment });
  return intent;
}

export async function markIntentFailed(id: string, errorMessage: string) {
  const intent = await updatePaymentIntent(id, { status: "failed" });
  if (intent) await logEvent(id, "payment_intent.failed", { error: errorMessage });
  return intent;
}

export async function issueReceiptForIntent(id: string) {
  await ensureMemoryLoaded();
  const existing = await findReceiptByPaymentIntentId(id);
  if (existing) return existing;
  const intent = await getPaymentIntentById(id);
  if (!intent) throw new Error("Payment intent not found.");
  const link = await getPaymentLinkById(intent.paymentLinkId);
  const receipt: ReceiptRecord = {
    id: randomUUID(),
    paymentIntentId: id,
    receiptCode: `gp-${id.slice(0, 6)}`,
    status: "issued",
    intentStatus: intent.status,
    amount: intent.amount,
    tokenSymbol: intent.tokenSymbol,
    network: intent.network,
    displayName: link?.displayName ?? "Ghost merchant",
    createdAt: now()
  };

  const valkey = getValkeyClient();
  if (!valkey) {
    receipts.set(receipt.receiptCode, receipt);
    await persistMemory();
    return receipt;
  }

  await setJsonValue(keys.receipt(receipt.receiptCode), receipt);
  await setJsonValue(keys.receiptByPaymentIntent(receipt.paymentIntentId), receipt.receiptCode);
  return receipt;
}

async function findReceiptByPaymentIntentId(paymentIntentId: string) {
  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    return [...receipts.values()].find((item) => item.paymentIntentId === paymentIntentId) ?? null;
  }
  const code = await getJsonValue<string>(keys.receiptByPaymentIntent(paymentIntentId));
  if (!code) return null;
  return await getJsonValue<ReceiptRecord>(keys.receipt(code));
}

export async function claimIntent(id: string, claimSignatureOverride?: string) {
  const intent = await getPaymentIntentById(id);
  if (!intent) throw new Error("Payment intent not found.");
  if (intent.status !== "claimable" && intent.status !== "claimed") throw new Error("Payment is not ready to claim.");
  if (intent.status === "claimed") {
    const existingReceipt = await findReceiptByPaymentIntentId(id);
    if (!existingReceipt) throw new Error("Receipt missing for claimed payment.");
    return { intent, receipt: existingReceipt };
  }

  const claimed = await updatePaymentIntent(id, { status: "claimed", claimSignature: claimSignatureOverride ?? `claim-${id.slice(0, 8)}` });
  const receipt = await issueReceiptForIntent(id);
  await logEvent(id, "payment_intent.claimed", { receiptCode: receipt.receiptCode });
  return { intent: claimed, receipt };
}

export async function getReceiptByCode(code: string) {
  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    return receipts.get(code) ?? null;
  }
  return await getJsonValue<ReceiptRecord>(keys.receipt(code));
}

export async function getDashboard(walletAddress: string, network: AppNetwork = DEFAULT_APP_NETWORK): Promise<DashboardPayload> {
  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    return {
      links: await listPaymentLinksByWallet(walletAddress, network),
      intents: [...paymentIntents.values()]
        .filter((item) => item.receiverWallet === walletAddress && item.network === network)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    };
  }

  const [links, intentIds] = await Promise.all([
    listPaymentLinksByWallet(walletAddress, network),
    getIndexedIds(keys.paymentIntentsByWallet(walletAddress, network))
  ]);
  const intents = await Promise.all(intentIds.map((id) => getJsonValue<PaymentIntentRecord>(keys.paymentIntent(id))));
  return {
    links,
    intents: intents.filter((item): item is PaymentIntentRecord => Boolean(item)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  };
}

export function getPersistenceMode() {
  return appEnv.isValkeyConfigured ? "valkey" : "memory";
}
