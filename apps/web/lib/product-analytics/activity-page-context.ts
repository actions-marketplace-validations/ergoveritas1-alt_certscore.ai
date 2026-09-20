/** Only known application routes can retain exact resource IDs. Query/fragment values never persist. */
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const STATIC_APP_PATHS = new Set([
  "/app", "/app/scans", "/app/domains", "/app/changes", "/app/signals", "/app/trackers", "/app/feedback",
  "/app/settings", "/app/settings/company", "/app/modify-plan", "/app/billing/checkout", "/app/billing/success",
  "/app/browser-scans/setup", "/app/monitor-site/setup", "/app/admin", "/app/admin/analytics", "/app/admin/companies",
  "/app/admin/companies/new", "/app/admin/users", "/app/admin/monitor-requests", "/app/admin/mcp", "/app/admin/pulse",
  "/app/admin/scans", "/app/admin/fintech", "/app/admin/v2-shadow-preview",
]);
const RESOURCE_APP_PATH = new RegExp(`^/app/(?:(?:scans|scanso|scanso2)/${UUID}(?:/json)?|domains/${UUID}|admin/(?:companies|pulse|scans)/${UUID}|admin/users/${UUID}/activity)$`, "i");

export function retainedActivityPagePath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  const path = value.split(/[?#]/, 1)[0]!;
  return STATIC_APP_PATHS.has(path) || RESOURCE_APP_PATH.test(path) ? path : null;
}

export function activityPageLink(event: { page_path?: string | null; normalized_route: string; scan_id?: string | null }) {
  const exact = retainedActivityPagePath(event.page_path);
  if (exact) return exact;
  const reconstructed = event.scan_id && /^\/(?:app\/)?(?:scans|scanso|scanso2)\/:id(?:\/json)?$/.test(event.normalized_route)
    ? event.normalized_route.replace(":id", event.scan_id) : event.normalized_route;
  return retainedActivityPagePath(reconstructed);
}
