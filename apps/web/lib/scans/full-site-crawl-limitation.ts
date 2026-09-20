/** Crawl permission failures limit coverage; they do not invalidate captured evidence. */
export function isRobotsCrawlLimitation(status: string | undefined, reason: string | null | undefined) {
  return status === "stopped" && [
    "robots_unavailable_or_blocked",
    "robots_delay_exceeds_crawl_budget",
  ].includes(reason ?? "");
}

/** Discovery availability does not invalidate the canonical completed page assessment. */
export function isRetainedCrawlLimitation(status: string | undefined, reason: string | null | undefined) {
  return isRobotsCrawlLimitation(status, reason) ||
    (status === "stopped" && reason === "discovery_unavailable_or_blocked");
}

export function canAssessRetainedCrawl(crawl: { status: string; stop_reason: string | null; completed_at: unknown }) {
  return Boolean(crawl.completed_at) && (crawl.status === "completed" || isRetainedCrawlLimitation(crawl.status, crawl.stop_reason));
}

export function unscannedCrawlPageLimitation(
  crawl: { status: string; stop_reason: string | null },
  page: { status: string; compact_json: unknown; limitation: string | null },
) {
  if (!isRetainedCrawlLimitation(crawl.status, crawl.stop_reason) || page.compact_json ||
    !(page.status === "queued" || (page.status === "cancelled" && page.limitation === crawl.stop_reason))) return null;
  return isRobotsCrawlLimitation(crawl.status, crawl.stop_reason)
    ? "not_scanned_crawl_permission_unverified" : "not_scanned_discovery_unavailable";
}

export function wasPageNotScannedForRobots(crawl: { status: string; stop_reason: string | null }, page: { status: string; compact_json: unknown }) {
  return isRobotsCrawlLimitation(crawl.status, crawl.stop_reason) && page.status === "queued" && !page.compact_json;
}
