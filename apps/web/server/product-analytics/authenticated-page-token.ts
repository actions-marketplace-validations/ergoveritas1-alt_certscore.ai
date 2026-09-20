import { createHmac, timingSafeEqual } from "node:crypto";
import { retainedActivityPagePath } from "../../lib/product-analytics/activity-page-context";
export type AuthenticatedPageIdentity = { id: string; requestedAt: number; path: string; userId: string };
function signature(identity: AuthenticatedPageIdentity, secret: string) {
  return createHmac("sha256", secret).update(JSON.stringify(["certscore.authenticated-page-request.v1", identity.id, identity.requestedAt, identity.path, identity.userId])).digest("hex");
}
export function issueAuthenticatedPageToken(identity: AuthenticatedPageIdentity, secret: string) {
  if (secret.length < 32 || retainedActivityPagePath(identity.path) !== identity.path) throw new Error("Invalid authenticated page proof configuration");
  return `a1.${identity.id}.${identity.requestedAt}.${signature(identity, secret)}`;
}
export function verifyAuthenticatedPageToken(token: string, path: string, userId: string, secret: string, now = Date.now()): AuthenticatedPageIdentity | null {
  if (secret.length < 32 || retainedActivityPagePath(path) !== path) return null;
  const match = /^a1\.([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.([0-9]{13})\.([0-9a-f]{64})$/.exec(token);
  if (!match) return null;
  const identity = { id: match[1]!, requestedAt: Number(match[2]), path, userId };
  if (identity.requestedAt > now + 5000 || now - identity.requestedAt > 24 * 60 * 60 * 1000) return null;
  return timingSafeEqual(Buffer.from(match[3]!, "hex"), Buffer.from(signature(identity, secret), "hex")) ? identity : null;
}
