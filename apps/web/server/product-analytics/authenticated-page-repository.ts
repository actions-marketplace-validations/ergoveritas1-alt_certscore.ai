import "server-only";
import { query } from "@website-signal-risk-scanner/db";
import { extractScanIdFromPath, normalizeAnalyticsRoute } from "../../lib/product-analytics/contract";
import type { AuthenticatedPageIdentity } from "./authenticated-page-token";
import type { ProductAnalyticsContext } from "./repository";
import { pruneProductAnalyticsEvents } from "./repository";
import { AUTHENTICATED_PAGE_UPSERT_SQL } from "./authenticated-page-sql";
export async function persistAuthenticatedPageRequest(identity: AuthenticatedPageIdentity, context: ProductAnalyticsContext,
  confirmed: boolean, detail: {language?: string; viewportBand?: string} = {}) {
  if (identity.userId !== context.userId) throw new Error("Authenticated page identity mismatch");
  const result = await query(AUTHENTICATED_PAGE_UPSERT_SQL, [identity.id, identity.requestedAt,
    normalizeAnalyticsRoute(identity.path), identity.path, identity.userId, context.organizationId,
    extractScanIdFromPath(identity.path) ?? null, confirmed, context.isStaff,
    context.browserFamily, context.osFamily, context.deviceClass, context.isBot, detail.language ?? null, detail.viewportBand ?? null, context.countryCode]);
  if (!result.rowCount) throw new Error("Authenticated page request conflict");
  await pruneProductAnalyticsEvents();
}
