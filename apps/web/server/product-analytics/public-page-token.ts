import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { normalizeAnalyticsRoute } from "../../lib/product-analytics/contract";
import { isPublicPagePath } from "../../lib/product-analytics/public-page-request";

const MAX_AGE_MS = 24 * 60 * 60 * 1_000;
export type PublicPageRequestIdentity = { id: string; requestedAt: number; route: string };

function signature(id: string, requestedAt: number, route: string, secret: string) {
  // Domain separation: this never exposes or reuses an authentication token.
  return createHmac("sha256", secret).update(JSON.stringify(["certscore.public-page-request.v1", id, requestedAt, route])).digest("hex");
}

export function issuePublicPageToken(route: string, secret: string, now = Date.now()) {
  if (secret.length < 32 || !isPublicPagePath(route)) throw new Error("Invalid public page logging configuration");
  const identity = { id: randomUUID(), requestedAt: now, route: normalizeAnalyticsRoute(route) };
  return { identity, token: `v1.${identity.id}.${now}.${signature(identity.id, now, identity.route, secret)}` };
}

export function verifyPublicPageToken(token: string, route: string, secret: string, now = Date.now()): PublicPageRequestIdentity | null {
  if (secret.length < 32 || !isPublicPagePath(route)) return null;
  const match = /^v1\.([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.([0-9]{13})\.([0-9a-f]{64})$/.exec(token);
  if (!match) return null;
  const [, id, timestamp, digest] = match;
  if (!id || !timestamp || !digest) return null;
  const requestedAt = Number(timestamp);
  if (requestedAt > now + 5_000 || now - requestedAt > MAX_AGE_MS) return null;
  const normalizedRoute = normalizeAnalyticsRoute(route);
  if (!timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signature(id, requestedAt, normalizedRoute, secret), "hex"))) return null;
  return { id, requestedAt, route: normalizedRoute };
}
