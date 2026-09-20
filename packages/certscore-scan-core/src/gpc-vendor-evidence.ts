import type { NormalizedVendorObservation } from "@certscore/contracts";

/** Aggregated vendor matchKind cannot establish the purpose of each request. */
export function gpcEndpointEvidence(vendor: NormalizedVendorObservation, eventId: string): "verified" | "association_only" | "unknown" {
  if (!vendor.matchedEvidenceIds.includes(eventId)) return "unknown";
  const sources = vendor.matchSources.filter(source => source.sourceEventId === eventId);
  if (!sources.length) return "unknown";
  if (sources.some(source => ["network_request", "script_url", "endpoint_pattern"].includes(source.source) &&
    ["hostname", "url_pattern"].includes(source.matchedField))) return "verified";
  return sources.every(source => ["cookie_name", "request_cookie", "set_cookie", "storage_key", "cmp_runtime_probe"].includes(source.source))
    ? "association_only" : "unknown";
}
