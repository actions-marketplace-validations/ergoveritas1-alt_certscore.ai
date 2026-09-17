import { readPreconsentTrackingTiming } from "./preconsent-tracking-timing";

/** Inputs are checklist/policy projections, never inventory rows or raw runtime events. */
export type ExecutiveRuntimeAssessment = {
  id: string; assessmentStatus: string; status: string;
  retainedEvidence?: Record<string, unknown>;
};
export type ExecutiveRuntimeCard = {
  id: "storage" | "requests" | "frames"; label: string; description: string;
  count: number | null; lowerBound: boolean;
  state: "observed" | "review" | "not_observed" | "not_confirmed";
  vendors: string[];
};
const definitions = [
  { id: "storage", label: "Cookies & storage", description: "Non-essential items before consent", rows: ["pre_consent_cookies_storage"] },
  { id: "requests", label: "Tracking requests", description: "Verified tracking integrations before consent", rows: ["pre_consent_third_party_tracking"] },
  { id: "frames", label: "Embedded content", description: "Third-party embeds before consent", rows: ["third_party_iframe_pre_consent", "embedded_content_pre_consent"] },
] as const;
const object = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

/** Count only identities already admitted by concern policy/checklist projection.
 * Bounded evidence samples yield lower bounds. Absence of an identity is never zero.
 * This presentation does not create findings or alter scores. */
export function projectExecutiveRuntimeCards(rows: ExecutiveRuntimeAssessment[], limited = false): ExecutiveRuntimeCard[] {
  return definitions.map(definition => {
    const relevant = rows.filter(row => (definition.rows as readonly string[]).includes(row.id));
    const positive = relevant.filter(row => ["gap_observed", "review_signal"].includes(row.assessmentStatus));
    const identities = new Set<string>();
    const vendors = new Set<string>();
    let incomplete = limited;
    for (const row of positive) {
      const evidence = row.retainedEvidence ?? {};
      if (definition.id === "requests") {
        for (const request of readPreconsentTrackingTiming(evidence.trackingRequestTiming)) {
          identities.add(request.vendorName.trim().toLowerCase()); vendors.add(request.vendorName);
        }
      } else if (definition.id === "frames") {
        // A distinct retained host proves at least one embed, not an exact frame count.
        for (const host of Array.isArray(evidence.embeddedContentHosts) ? evidence.embeddedContentHosts : []) {
          if (typeof host === "string" && host.trim()) identities.add(host.toLowerCase());
        }
      } else {
        const items = evidence.eligiblePreconsentCookieStorageRows;
        if (!Array.isArray(items)) { incomplete = true; continue; }
        for (const item of items) {
          const record = object(item);
          const exact = record?.exactStorageIdentity;
          if (typeof exact === "string" && exact.length) {
            try { const parts: unknown = JSON.parse(exact); if (Array.isArray(parts) && parts.length >= 3 && parts.slice(0, 3).every(part => typeof part === "string")) { identities.add(JSON.stringify([record?.storageType, parts])); continue; } } catch { /* Unknown identity remains uncounted. */ }
          }
          if (record?.storageType === "cookie" && typeof record.name === "string" && typeof record.domain === "string" && typeof record.path === "string") {
            identities.add(JSON.stringify([record.storageType, record.name, record.domain, record.path, record.partitionKey ?? null]));
          } else { incomplete = true; }
        }
      }
    }
    // Both embed checks must be assessed before a zero can be shown.
    const absent = !limited && definition.rows.every(id => relevant.some(row => row.id === id)) && relevant.every(row => row.assessmentStatus === "checked" && row.status === "Not observed");
    const count = identities.size || (absent ? 0 : null);
    return {
      id: definition.id, label: definition.label, description: definition.description,
      count, lowerBound: identities.size > 0 && (definition.id !== "storage" || incomplete),
      state: positive.some(row => row.assessmentStatus === "gap_observed") ? "observed" : positive.length ? "review" : absent ? "not_observed" : "not_confirmed",
      vendors: [...vendors].sort(),
    };
  });
}

/** Read the already-persisted site checklist and finding evidence; no rescoring. */
export function projectSiteExecutiveRuntimeCards(score: {
  limitedPages: number;
  evidencePages?: Array<{ rows: Array<{ id: string; assessmentStatus: string; status: string }> }>;
  priorityReview: Array<{ evidenceJson: Record<string, unknown> }>;
  assessedStorageRecords?: Record<string, unknown>[];
}): ExecutiveRuntimeCard[] {
  const evidence = new Map<string, Record<string, unknown>>();
  for (const finding of score.priorityReview) {
    for (const value of Array.isArray(finding.evidenceJson.criticalEvidence) ? finding.evidenceJson.criticalEvidence : []) {
      const row = object(value);
      if (typeof row?.rowId === "string") evidence.set(row.rowId, object(row.retainedEvidence) ?? {});
    }
  }
  if (score.assessedStorageRecords) evidence.set("pre_consent_cookies_storage", {
    ...evidence.get("pre_consent_cookies_storage"), eligiblePreconsentCookieStorageRows: score.assessedStorageRecords,
  });
  const pages = score.evidencePages ?? [];
  return projectExecutiveRuntimeCards(pages.flatMap(page => page.rows.map(row => ({ ...row, retainedEvidence: evidence.get(row.id) }))), score.limitedPages > 0).map(card => {
    const requiredIds = definitions.find(definition => definition.id === card.id)!.rows;
    const missingPageAssessment = pages.some(page => requiredIds.some(id => !page.rows.some(row => row.id === id)));
    return card.count === 0 && missingPageAssessment ? { ...card, count: null, state: "not_confirmed" } : card;
  });
}
