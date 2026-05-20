/**
 * Safely extract a human-readable error string from an unknown API response body.
 * Guards against APIs that return { error: <object> } instead of { error: <string> }.
 */
export function extractApiError(body: unknown, fallback = "Request failed."): string {
  if (!body || typeof body !== "object") return fallback;
  const b = body as Record<string, unknown>;
  const raw = b.error ?? b.message ?? b.detail;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (raw != null) return JSON.stringify(raw);
  return fallback;
}
