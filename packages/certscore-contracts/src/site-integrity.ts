import { z } from "zod";

/** Observations only: concealment is not proof of compromise or data processing. */
export const SITE_INTEGRITY_LIMITS = { inspectedLinks: 1000, retainedLinks: 12, ancestorDepth: 6, captureBudgetMs: 20 } as const;
export const SITE_INTEGRITY_FINDING_ID = "site_integrity_hidden_outbound_links";
export const SITE_INTEGRITY_SIGNAL = "site_integrity.hidden_outbound_links";
export const SITE_INTEGRITY_POLICY_VERSION = "certscore.site-integrity-policy.v3";
// Owner-approved September 17, 2026: verified hidden links receive an overall-score effect.
export const SITE_INTEGRITY_SEVERITY = "high" as const;
export const SITE_INTEGRITY_COPY = {
  title: "Hidden outbound links",
  summary: "Hidden outbound links were detected in retained page evidence and need review.",
  description: "Outbound links were concealed using off-screen positioning or zero-size styling. Review whether these links were intentionally added.",
  action: "Ask the site owner to review the retained destination domains and concealment methods against the intended page content.",
} as const;

const publicPageUrl = z.string().url().max(2048).refine(value => {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  } catch { return false; }
}, "A display-safe HTTP page URL is required");
const domain = z.string().max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/);
export const siteIntegrityLinkSchema = z.object({
  evidenceRef: z.string().regex(/^site_integrity:link:\d{1,6}$/),
  destinationDomain: domain,
  concealment: z.enum(["offscreen_position", "zero_size_container", "zero_font_size"]),
}).strict();
const observationFields = z.object({
  sourceLane: z.literal("runtime_evidence"),
  documentUrl: publicPageUrl,
  documentToken: z.string().min(1).max(512),
  capturedAt: z.string().datetime(),
  inspectedLinks: z.number().int().min(0).max(SITE_INTEGRITY_LIMITS.inspectedLinks),
  truncated: z.boolean(),
  links: z.array(siteIntegrityLinkSchema).max(SITE_INTEGRITY_LIMITS.retainedLinks),
}).strict();
const observationV1 = observationFields.extend({ contractVersion: z.literal("certscore.site-integrity-observation.v1"), scope: z.literal("starting_page_main_document") });
const observationV2 = observationFields.extend({ contractVersion: z.literal("certscore.site-integrity-observation.v2"), scope: z.literal("additional_page_main_document") });
export const siteIntegrityObservationSchema = z.discriminatedUnion("contractVersion", [observationV1, observationV2]).superRefine((value, ctx) => {
  if (new Set(value.links.map(link => link.evidenceRef)).size !== value.links.length ||
      value.links.length > value.inspectedLinks || value.links.some(link => Number(link.evidenceRef.split(":").at(-1)) >= value.inspectedLinks)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Distinct inspected link references are required" });
  }
});
const projectionFields = z.object({
  scanId: z.string().min(1).max(160),
  sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  observationHash: z.string().regex(/^[a-f0-9]{64}$/),
  verificationStatus: z.literal("verified"),
}).strict();
export const siteIntegrityProjectionSchema = z.discriminatedUnion("contractVersion", [
  projectionFields.extend({
    contractVersion: z.literal("certscore.site-integrity-projection.v1"),
    evidenceRef: z.literal("CanonicalEvidenceBundle.json#siteIntegrityObservation"),
    observation: siteIntegrityObservationSchema.refine(value => value.contractVersion === "certscore.site-integrity-observation.v1"),
  }),
  projectionFields.extend({
    contractVersion: z.literal("certscore.site-integrity-projection.v2"),
    pageId: z.string().uuid(), attemptId: z.string().uuid(), configurationHash: z.string().regex(/^[a-f0-9]{64}$/),
    evidenceRef: z.string().regex(/^full-site:[a-f0-9-]{36}:[a-f0-9-]{36}:evidence.json#siteIntegrityObservation$/),
    observation: siteIntegrityObservationSchema.refine(value => value.contractVersion === "certscore.site-integrity-observation.v2"),
  }),
]).superRefine((value, ctx) => {
  if (value.contractVersion === "certscore.site-integrity-projection.v2" && value.evidenceRef !== `full-site:${value.pageId}:${value.attemptId}:evidence.json#siteIntegrityObservation`) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Evidence reference must match page attempt" });
  }
});
export type SiteIntegrityObservation = z.infer<typeof siteIntegrityObservationSchema>;
export type SiteIntegrityProjection = z.infer<typeof siteIntegrityProjectionSchema>;

/** Precision-first, factual review only. Never called by a display component. */
export function qualifiesSiteIntegrityReview(value: unknown): value is SiteIntegrityProjection {
  const parsed = siteIntegrityProjectionSchema.safeParse(value);
  if (!parsed.success) return false;
  const links = parsed.data.observation.links;
  return links.length >= 1;
}
