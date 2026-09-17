/** Shared inventory labels. Count units are supplied separately: overview/mix
 * counts are distinct identities; retained event counts remain evidence detail.
 * SDK/script requests are not additional frames.
 */
export const INVENTORY_METRIC_LABELS = {
  storage: "Cookies & storage",
  requests: "Requests",
  frames: "Embedded frames",
} as const;
export const INVENTORY_FAMILY_ORDER = ["requests", "storage", "frames"] as const;
export const INVENTORY_CLASSIFICATION_ORDER = ["Non-essential", "Review", "Unclassified", "Contextual", "Essential"] as const;
export const INVENTORY_CLASSIFICATION_LABELS: Record<string, string> = {
  "Non-essential": "Non-essential", Review: "Classification review", Unclassified: "Unknown purpose", Contextual: "Contextual", Essential: "Essential",
};
/** Explain evidence limits without implying a legal or necessity conclusion. */
export const INVENTORY_CLASSIFICATION_DESCRIPTIONS: Record<string, string> = {
  "Non-essential": "Retained evidence supports a non-essential activity classification.",
  Review: "The classification needs review; this is not by itself a priority finding.",
  Unclassified: "The retained evidence does not establish the resource’s purpose. This is missing classification, not a detected issue.",
  Contextual: "An observation retained for context, not proof of necessity or consent exemption. Frames use this label for the frame observation itself; related requests, storage and pre-consent findings are assessed separately.",
  Essential: "Retained classification identifies a necessary or security purpose.",
};
export function inventoryMetricLabel(label: string) {
  if (["Network requests", "Network resources", "Request events"].includes(label)) return INVENTORY_METRIC_LABELS.requests;
  if (["Embedded content", "Frame observations", "Embeds"].includes(label)) return INVENTORY_METRIC_LABELS.frames;
  return label;
}
export function inventoryMetricOrder(label: string) {
  const index = INVENTORY_FAMILY_ORDER.findIndex(family => INVENTORY_METRIC_LABELS[family] === inventoryMetricLabel(label));
  return index < 0 ? INVENTORY_FAMILY_ORDER.length : index;
}
/** Display grouping only; preserve the original kinds in retained evidence. */
export function inventoryTypeBreakdown(rows: readonly { label: string; count: number }[]) {
  const grouped = new Map<string, number>();
  for (const row of rows) {
    const family = inventoryMetricFamily(row.label);
    const label = family ? INVENTORY_METRIC_LABELS[family] : row.label;
    grouped.set(label, (grouped.get(label) ?? 0) + row.count);
  }
  return [...grouped].map(([label, count]) => ({ label, count })).sort((a, b) => inventoryMetricOrder(a.label) - inventoryMetricOrder(b.label));
}
export function inventoryMetricFamily(kind: string) {
  if (kind === "cookie" || kind === "storage") return "storage";
  if (kind === "request" || kind === "tracker") return "requests";
  if (kind === "embed") return "frames";
  return null;
}
