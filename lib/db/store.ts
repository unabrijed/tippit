import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import type { SupportedToken } from "@/lib/solana/tokens";
import { slugify } from "@/lib/format";
import { appEnv, getPostgresUrl } from "@/lib/env";
import { DEFAULT_APP_NETWORK, type AppNetwork } from "@/lib/network";
import { getValkeyClient } from "@/lib/valkey/client";
import type { DashboardPayload, LinkStatus, MerchantRecord, PaymentIntentRecord, PaymentLinkRecord, ReceiptRecord } from "@/lib/types";

// ---------------------------------------------------------------------------
// Persistence tier helpers
// ---------------------------------------------------------------------------

function isPrismaAvailable() {
  return Boolean(getPostgresUrl());
}

function getPrisma() {
  const { getPrismaClient } = require("@/lib/db/prisma") as typeof import("@/lib/db/prisma");
  return getPrismaClient();
}

// ---------------------------------------------------------------------------
// In-memory / file store (dev fallback)
// ---------------------------------------------------------------------------

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
const localStorePath = process.env.VERCEL
  ? path.join(tmpdir(), "tippit", "store.json")
  : path.join(process.cwd(), ".tippit", "store.json");
let memoryLoaded = false;

type LocalStoreSnapshot = {
  merchants: MerchantRecord[];
  paymentLinks: PaymentLinkRecord[];
  paymentIntents: PaymentIntentRecord[];
  receipts: ReceiptRecord[];
  paymentEvents: EventRecord[];
};

const keys = {
  merchant: (walletAddress: string, network: AppNetwork) => `tippit:merchant:${network}:${walletAddress}`,
  paymentLink: (id: string) => `tippit:payment-link:${id}`,
  paymentLinkBySlug: (slug: string) => `tippit:payment-link:slug:${slug}`,
  paymentLinksByWallet: (walletAddress: string, network: AppNetwork) => `tippit:payment-links:wallet:${network}:${walletAddress}`,
  paymentIntent: (id: string) => `tippit:payment-intent:${id}`,
  paymentIntentsByWallet: (walletAddress: string, network: AppNetwork) => `tippit:payment-intents:wallet:${network}:${walletAddress}`,
  receipt: (code: string) => `tippit:receipt:${code}`,
  receiptByPaymentIntent: (paymentIntentId: string) => `tippit:receipt:payment-intent:${paymentIntentId}`,
  paymentEvents: "tippit:payment-events"
} as const;

function normalizeMerchantRecord(merchant: MerchantRecord | (Omit<MerchantRecord, "network"> & { network?: AppNetwork })): MerchantRecord {
  return { ...merchant, network: merchant.network ?? DEFAULT_APP_NETWORK };
}

function normalizePaymentLinkRecord(link: PaymentLinkRecord | (Omit<PaymentLinkRecord, "network"> & { network?: AppNetwork })): PaymentLinkRecord {
  return { ...link, network: link.network ?? DEFAULT_APP_NETWORK, tokenType: (link as PaymentLinkRecord).tokenType ?? (((link as PaymentLinkRecord).tokenSymbol as SupportedToken) || "USDC") };
}

function normalizePaymentIntentRecord(intent: PaymentIntentRecord | (Omit<PaymentIntentRecord, "network"> & { network?: AppNetwork })): PaymentIntentRecord {
  return { ...intent, network: intent.network ?? DEFAULT_APP_NETWORK, tokenType: (intent as PaymentIntentRecord).tokenType ?? (((intent as PaymentIntentRecord).tokenSymbol as SupportedToken) || "USDC") };
}

function normalizeReceiptRecord(receipt: ReceiptRecord | (Omit<ReceiptRecord, "network"> & { network?: AppNetwork })): ReceiptRecord {
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
  try {
    await mkdir(path.dirname(localStorePath), { recursive: true });
    await writeFile(localStorePath, JSON.stringify(getLocalSnapshot(), null, 2), "utf8");
  } catch (error) {
    console.warn("Failed to persist Tippit local store; continuing with in-memory storage.", error);
  }
}

async function ensureMemoryLoaded() {
  if (getValkeyClient() || memoryLoaded) return;

  if (process.env.VERCEL && !isPrismaAvailable() && !getValkeyClient()) {
    console.error("[tippit] WARNING: Running on Vercel without Postgres or Valkey. Payment links will not persist across requests. Set DATABASE_URL or VALKEY_URL.");
  }

  try {
    const raw = await readFile(localStorePath, "utf8");
    hydrateMemory(JSON.parse(raw) as LocalStoreSnapshot);
  } catch {
    merchants.clear();
    paymentLinks.clear();
    paymentIntents.clear();
    receipts.clear();
    paymentEvents.splice(0, paymentEvents.length);
    await persistMemory();
  }

  memoryLoaded = true;
}

function enrichLink(link: PaymentLinkRecord): PaymentLinkRecord {
  const isExpired = new Date(link.expiresAt).getTime() < Date.now();
  const nextStatus: LinkStatus = isExpired && link.status === "active" ? "expired" : link.status;
  return { ...link, status: nextStatus, isExpired };
}

// ---------------------------------------------------------------------------
// Valkey helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Prisma record mappers
// ---------------------------------------------------------------------------

function prismaLinkToRecord(row: {
  id: string; merchantId: string; receiverWallet: string; displayName: string; slug: string; title: string; description: string | null;
  amount: number; tokenType: string; tokenMint: string | null; tokenSymbol: string; network: string; linkType: string;
  privacyMode: string; status: string; expiresAt: Date; createdAt: Date; updatedAt: Date;
}): PaymentLinkRecord {
  return enrichLink({
    id: row.id,
    merchantId: row.merchantId,
    receiverWallet: row.receiverWallet,
    displayName: row.displayName,
    slug: row.slug,
    title: row.title,
    description: row.description ?? undefined,
    amount: row.amount,
    tokenType: row.tokenType as SupportedToken,
    tokenMint: row.tokenMint ?? undefined,
    tokenSymbol: row.tokenSymbol,
    network: row.network as AppNetwork,
    linkType: row.linkType as "one_time" | "reusable",
    privacyMode: row.privacyMode as "umbra_utxo" | "public_transfer",
    status: row.status as LinkStatus,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function prismaIntentToRecord(row: {
  id: string; paymentLinkId: string; linkTitle: string; receiverWallet: string; payerWallet: string | null;
  amount: number; tokenType: string; tokenMint: string | null; tokenSymbol: string; network: string;
  status: string; solanaSignature: string | null; claimSignature: string | null; umbraUtxoCommitment: string | null;
  expiresAt: Date; createdAt: Date; updatedAt: Date;
}): PaymentIntentRecord {
  return {
    id: row.id,
    paymentLinkId: row.paymentLinkId,
    linkTitle: row.linkTitle,
    receiverWallet: row.receiverWallet,
    payerWallet: row.payerWallet ?? undefined,
    amount: row.amount,
    tokenType: row.tokenType as SupportedToken,
    tokenMint: row.tokenMint ?? undefined,
    tokenSymbol: row.tokenSymbol,
    network: row.network as AppNetwork,
    status: row.status as PaymentIntentRecord["status"],
    solanaSignature: row.solanaSignature ?? undefined,
    claimSignature: row.claimSignature ?? undefined,
    umbraUtxoCommitment: row.umbraUtxoCommitment ?? undefined,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function prismaReceiptToRecord(row: {
  id: string; paymentIntentId: string; receiptCode: string; status: string; intentStatus: string;
  amount: number; tokenSymbol: string; network: string; displayName: string; createdAt: Date;
}): ReceiptRecord {
  return {
    id: row.id,
    paymentIntentId: row.paymentIntentId,
    receiptCode: row.receiptCode,
    status: row.status as "issued",
    intentStatus: row.intentStatus as ReceiptRecord["intentStatus"],
    amount: row.amount,
    tokenSymbol: row.tokenSymbol,
    network: row.network as AppNetwork,
    displayName: row.displayName,
    createdAt: row.createdAt.toISOString()
  };
}

// ---------------------------------------------------------------------------
// Event logging (shared across tiers)
// ---------------------------------------------------------------------------

async function logEvent(paymentIntentId: string, eventType: string, eventPayload?: Record<string, unknown>) {
  if (isPrismaAvailable()) {
    const db = getPrisma();
    await db.paymentEvent.create({ data: { paymentIntentId, eventType, eventPayload: (eventPayload ?? undefined) as object | undefined } });
    return;
  }

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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function upsertMerchant(walletAddress: string, displayName?: string, network: AppNetwork = DEFAULT_APP_NETWORK): Promise<MerchantRecord> {
  if (isPrismaAvailable()) {
    const db = getPrisma();
    const row = await db.merchant.upsert({
      where: { walletAddress_network: { walletAddress, network } },
      update: { displayName: displayName || undefined },
      create: { walletAddress, displayName: displayName || "Tippit creator", network }
    });
    return { id: row.id, walletAddress: row.walletAddress, displayName: row.displayName, network: row.network as AppNetwork, createdAt: row.createdAt.toISOString() };
  }

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
    const merchant: MerchantRecord = { id: randomUUID(), walletAddress, displayName: displayName || "Tippit creator", network, createdAt: now() };
    merchants.set(merchant.id, merchant);
    await persistMemory();
    return merchant;
  }

  const existing = await getJsonValue<MerchantRecord>(keys.merchant(walletAddress, network));
  const merchant: MerchantRecord = existing
    ? { ...existing, displayName: displayName || existing.displayName }
    : { id: randomUUID(), walletAddress, displayName: displayName || "Tippit creator", network, createdAt: now() };
  await setJsonValue(keys.merchant(walletAddress, network), merchant);
  return merchant;
}

export async function createPaymentLink(input: PaymentLinkInsert): Promise<PaymentLinkRecord> {
  if (input.tokenType !== "USDC") throw new Error("SOL links are disabled.");
  if (isPrismaAvailable()) {
    const db = getPrisma();
    const merchant = await upsertMerchant(input.receiverWallet, input.displayName, input.network);
    const id = randomUUID();
    const slug = `${slugify(input.title)}-${id.slice(0, 6)}`;
    const row = await db.paymentLink.create({
      data: {
        id,
        merchantId: merchant.id,
        receiverWallet: input.receiverWallet,
        displayName: input.displayName || merchant.displayName,
        slug,
        title: input.title,
        description: input.description,
        amount: input.amount,
        tokenType: input.tokenType,
        tokenMint: input.tokenMint,
        tokenSymbol: input.tokenType,
        network: input.network,
        linkType: input.linkType,
        privacyMode: input.privacyMode ?? (input.tokenType === "USDC" ? "umbra_utxo" : "public_transfer"),
        status: "active",
        expiresAt: new Date(input.expiresAt)
      }
    });
    return prismaLinkToRecord(row);
  }

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
      privacyMode: input.privacyMode ?? (input.tokenType === "USDC" ? "umbra_utxo" : "public_transfer"),
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
    privacyMode: input.privacyMode ?? (input.tokenType === "USDC" ? "umbra_utxo" : "public_transfer"),
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

export async function listPaymentLinksByWallet(walletAddress: string, network: AppNetwork = DEFAULT_APP_NETWORK): Promise<PaymentLinkRecord[]> {
  if (isPrismaAvailable()) {
    const db = getPrisma();
    const rows = await db.paymentLink.findMany({
      where: { receiverWallet: walletAddress, network },
      orderBy: { createdAt: "desc" }
    });
    return rows.map(prismaLinkToRecord);
  }

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

export async function getPaymentLinkBySlug(slug: string): Promise<PaymentLinkRecord | null> {
  if (isPrismaAvailable()) {
    const db = getPrisma();
    const row = await db.paymentLink.findUnique({ where: { slug } });
    return row ? prismaLinkToRecord(row) : null;
  }

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

export async function getPaymentLinkById(id: string): Promise<PaymentLinkRecord | null> {
  if (isPrismaAvailable()) {
    const db = getPrisma();
    const row = await db.paymentLink.findUnique({ where: { id } });
    return row ? prismaLinkToRecord(row) : null;
  }

  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    const link = paymentLinks.get(id);
    return link ? enrichLink(link) : null;
  }

  const link = await getJsonValue<PaymentLinkRecord>(keys.paymentLink(id));
  return link ? enrichLink(link) : null;
}

export async function createPaymentIntent(input: { paymentLinkId: string; payerWallet?: string; amount: number; tokenMint?: string; tokenType?: SupportedToken; network: AppNetwork }): Promise<PaymentIntentRecord> {
  const link = await getPaymentLinkById(input.paymentLinkId);
  if (!link) throw new Error("Tip link not found.");
  if (link.network !== input.network) throw new Error(`This tip link belongs to ${link.network}, but ${input.network} is selected.`);
  if (link.status !== "active") throw new Error("This tip link is not active.");
  if (link.isExpired) throw new Error("This tip link has expired.");
  if (link.tokenType !== "USDC") throw new Error("SOL payments are disabled.");

  if (isPrismaAvailable()) {
    const db = getPrisma();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const row = await db.paymentIntent.create({
      data: {
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
        expiresAt
      }
    });
    const intent = prismaIntentToRecord(row);
    await logEvent(row.id, "payment_intent.created");
    return intent;
  }

  await ensureMemoryLoaded();
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

export async function getPaymentIntentById(id: string): Promise<PaymentIntentRecord | null> {
  if (isPrismaAvailable()) {
    const db = getPrisma();
    const row = await db.paymentIntent.findUnique({ where: { id } });
    return row ? prismaIntentToRecord(row) : null;
  }

  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    return paymentIntents.get(id) ?? null;
  }
  return await getJsonValue<PaymentIntentRecord>(keys.paymentIntent(id));
}

export async function updatePaymentIntent(id: string, patch: Partial<PaymentIntentRecord>): Promise<PaymentIntentRecord | null> {
  if (isPrismaAvailable()) {
    const db = getPrisma();
    try {
      const row = await db.paymentIntent.update({
        where: { id },
        data: {
          status: patch.status,
          solanaSignature: patch.solanaSignature,
          claimSignature: patch.claimSignature,
          umbraUtxoCommitment: patch.umbraUtxoCommitment
        }
      });
      return prismaIntentToRecord(row);
    } catch {
      return null;
    }
  }

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

  if (isPrismaAvailable()) {
    const db = getPrisma();
    await db.paymentLink.updateMany({
      where: { id: intent.paymentLinkId, linkType: "one_time" },
      data: { status: "paid" }
    });
  } else {
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
  }

  await logEvent(id, "payment_intent.claimable", { signature, umbraUtxoCommitment });
  return intent;
}

export async function markIntentFailed(id: string, errorMessage: string) {
  const intent = await updatePaymentIntent(id, { status: "failed" });
  if (intent) await logEvent(id, "payment_intent.failed", { error: errorMessage });
  return intent;
}

export async function issueReceiptForIntent(id: string): Promise<ReceiptRecord> {
  const existing = await findReceiptByPaymentIntentId(id);
  if (existing) return existing;

  const intent = await getPaymentIntentById(id);
  if (!intent) throw new Error("Payment intent not found.");
  const link = await getPaymentLinkById(intent.paymentLinkId);

  if (isPrismaAvailable()) {
    const db = getPrisma();
    const receiptCode = `gp-${id.slice(0, 6)}`;
    const row = await db.receipt.create({
      data: {
        paymentIntentId: id,
        receiptCode,
        status: "issued",
        intentStatus: intent.status,
        amount: intent.amount,
        tokenSymbol: intent.tokenSymbol,
        network: intent.network,
        displayName: link?.displayName ?? "Tippit creator"
      }
    });
    return prismaReceiptToRecord(row);
  }

  const receipt: ReceiptRecord = {
    id: randomUUID(),
    paymentIntentId: id,
    receiptCode: `gp-${id.slice(0, 6)}`,
    status: "issued",
    intentStatus: intent.status,
    amount: intent.amount,
    tokenSymbol: intent.tokenSymbol,
    network: intent.network,
    displayName: link?.displayName ?? "Tippit creator",
    createdAt: now()
  };

  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    receipts.set(receipt.receiptCode, receipt);
    await persistMemory();
    return receipt;
  }

  await setJsonValue(keys.receipt(receipt.receiptCode), receipt);
  await setJsonValue(keys.receiptByPaymentIntent(receipt.paymentIntentId), receipt.receiptCode);
  return receipt;
}

async function findReceiptByPaymentIntentId(paymentIntentId: string): Promise<ReceiptRecord | null> {
  if (isPrismaAvailable()) {
    const db = getPrisma();
    const row = await db.receipt.findUnique({ where: { paymentIntentId } });
    return row ? prismaReceiptToRecord(row) : null;
  }

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

export async function getReceiptByCode(code: string): Promise<ReceiptRecord | null> {
  if (isPrismaAvailable()) {
    const db = getPrisma();
    const row = await db.receipt.findUnique({ where: { receiptCode: code } });
    return row ? prismaReceiptToRecord(row) : null;
  }

  const valkey = getValkeyClient();
  if (!valkey) {
    await ensureMemoryLoaded();
    return receipts.get(code) ?? null;
  }
  return await getJsonValue<ReceiptRecord>(keys.receipt(code));
}

export async function getDashboard(walletAddress: string, network: AppNetwork = DEFAULT_APP_NETWORK): Promise<DashboardPayload> {
  if (isPrismaAvailable()) {
    const db = getPrisma();
    const [links, intents] = await Promise.all([
      db.paymentLink.findMany({ where: { receiverWallet: walletAddress, network }, orderBy: { createdAt: "desc" } }),
      db.paymentIntent.findMany({ where: { receiverWallet: walletAddress, network }, orderBy: { createdAt: "desc" } })
    ]);
    return {
      links: links.map(prismaLinkToRecord),
      intents: intents.map(prismaIntentToRecord)
    };
  }

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
  if (isPrismaAvailable()) return "postgres";
  return appEnv.isValkeyConfigured ? "valkey" : "memory";
}
