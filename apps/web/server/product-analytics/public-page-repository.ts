import "server-only";
import { query } from "@website-signal-risk-scanner/db";
import type { PublicPageRequestIdentity } from "./public-page-token";
import { PUBLIC_PAGE_UPSERT_SQL } from "./public-page-sql";
import { pruneProductAnalyticsEvents } from "./repository";

export async function persistPublicPageRequest(identity: PublicPageRequestIdentity, browserConfirmed: boolean, userAgent: string) {
  await query(PUBLIC_PAGE_UPSERT_SQL, [identity.id, identity.requestedAt, identity.route, browserConfirmed,
    /bot|crawler|spider|headless|lighthouse|synthetic/i.test(userAgent)]);
  await pruneProductAnalyticsEvents();
}
