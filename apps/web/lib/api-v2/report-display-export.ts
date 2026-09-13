/** Report content only: omit diagnostic downloads and encode repeated records once. */
const REPORT_FIELDS = new Set([
  "scan", "score", "verdict", "executiveHeadline", "findings", "nextStep", "metrics",
  "coverage", "controls", "consentVendor", "consentRows", "gdprTransparencyRows",
  "preConsentRuntimeRows", "trackingExternalRows", "transportRows", "relatedRows",
  "policySurfaceCoverage", "gpcResponse", "gpcLaneStatus", "acceptPath", "rejectPath",
  "choicePathComparison", "timeline", "inventory", "inventorySummary", "resourceInventory",
  "trackerVendors", "collectionFields", "collectionLimitations", "collectionStatus",
  "collectionSurfaces", "collectionTableRows", "siteMetadata", "fullSiteReport",
]);
const DIAGNOSTICS = new Set(["canonicalEvidenceJson", "evidenceJson", "runtimeEvidenceGraph"]);
const pointer = (key: string) => key.replace(/~/g, "~0").replace(/\//g, "~1");

export function buildReportDisplayExport(report: Record<string, unknown>) {
  const seen = new Map<string, string>();
  function project(value: unknown, path: string): unknown {
    if (!value || typeof value !== "object") return value;
    const projected: unknown = Array.isArray(value)
      ? value.map((child, i) => project(child, `${path}/${i}`))
      : Object.fromEntries(Object.entries(value).filter(([key]) => !DIAGNOSTICS.has(key))
        .map(([key, child]) => [key, project(child, `${path}/${pointer(key)}`)]));
    // References preserve every displayed relationship without repeating large records.
    const encoded = JSON.stringify(projected);
    if (encoded.length >= 512) {
      const previous = seen.get(encoded);
      if (previous) return { reportContentRef: previous };
      seen.set(encoded, path);
    }
    return projected;
  }
  return {
    exportContent: {
      scope: "report_display_content",
      exclusions: ["diagnostic_json_downloads", "internal_runtime_graph", "image_binary_bytes"],
      references: "reportContentRef is an RFC 6901 pointer into this exported document. Resolve it to retrieve an identical displayed record stored once. Form fields, inventory rows, coverage limitations and snapshot links are retained.",
    },
    ...Object.fromEntries(Object.entries(report).filter(([key]) => REPORT_FIELDS.has(key))
      .map(([key, value]) => [key, project(value, `/${pointer(key)}`)])),
  };
}
