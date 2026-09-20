import { z } from "zod";
import { buildPromotionGradePreconsentRequests } from "./preconsent-public-evidence";

const requestSchema = z.object({
  requestUrl: z.string().url().regex(/^https?:\/\//),
  vendorName: z.string().min(1),
  vendorCategory: z.enum(["advertising", "advertising_measurement", "analytics", "dmp", "identity",
    "identity_resolution", "marketing_automation", "retargeting", "sale_share", "session_replay", "tracking"]),
  firstSeenMs: z.number().finite().nonnegative(), runtimePhase: z.literal("pre_consent"),
  evidenceRefs: z.array(z.string()),
});
export const preconsentTrackingTimingSchema = z.object({
  version: z.literal("classified-request-timing.v1"), requests: z.array(requestSchema).max(12),
});

/** Called at concern/checklist projection, never from raw observations in a display. */
export function projectPreconsentTrackingTiming(rows: unknown[]) {
  const requests = buildPromotionGradePreconsentRequests({ rows, maxItems: 12 }).filter(request =>
    request.runtimePhase && ["pre_consent", "before_consent", "before_consent_request"].includes(request.runtimePhase) &&
    request.firstSeenMs !== null);
  return preconsentTrackingTimingSchema.parse({ version: "classified-request-timing.v1", requests: requests.map(request => ({
    requestUrl: request.requestUrl, vendorName: request.vendorName, vendorCategory: request.vendorCategory,
    firstSeenMs: request.firstSeenMs, runtimePhase: "pre_consent", evidenceRefs: request.evidenceRefs,
  })) });
}

/** Read already-projected request/time pairs. Legacy aggregate timestamps are not proof. */
export function readPreconsentTrackingTiming(value: unknown) {
  const parsed = preconsentTrackingTimingSchema.safeParse(value);
  return parsed.success ? parsed.data.requests : [];
}

export function describePreconsentTrackingTiming(value: unknown) {
  const requests = readPreconsentTrackingTiming(value);
  if (!requests.length) return "Tracking was established by the retained finding, but its precise request timing is unavailable.";
  const first = requests.reduce((a, b) => a.firstSeenMs <= b.firstSeenMs ? a : b);
  const vendors = [...new Set(requests.map(request => request.vendorName))];
  return `Tracking-classified requests were observed before consent: ${vendors.slice(0, 3).join(", ")}. The first retained qualifying request was ${first.vendorName} at ${(first.firstSeenMs / 1000).toPrecision(3)}s after scan start.`;
}
