import { z } from "zod";
import { qualifiesSiteIntegrityReview, SITE_INTEGRITY_POLICY_VERSION, SITE_INTEGRITY_LIMITS } from "@certscore/contracts";
import { SCORING_FAMILIES, SCORING_RULE_BY_ID } from "./scoring-policy";
import type { NormalizedConcernScoreEffect } from "./normalized-concerns";

export const SITE_INTEGRITY_SCORE_POLICY_KEY = "site_integrity.hidden_outbound_links";
const rule = SCORING_RULE_BY_ID.get("site_integrity_hidden_outbound_links")!;
export function hiddenLinkDeduction(count: number) {
  if (!Number.isSafeInteger(count) || count < 1) return 0;
  return Math.min(SCORING_FAMILIES.site_integrity.cap, rule.identity!.first + (count - 1) * rule.identity!.subsequentEach);
}

/** Concern-policy output, produced only from the verified typed projection. */
export function buildSiteIntegrityScoreEffects(projection: unknown): NormalizedConcernScoreEffect[] {
  if (!qualifiesSiteIntegrityReview(projection)) return [];
  const page = projection.contractVersion === "certscore.site-integrity-projection.v2" ? projection.pageId : "homepage";
  const observedActivity = projection.observation.links.map(link => JSON.stringify([projection.scanId, page, link.evidenceRef]));
  return [{ appliesTo: "certscore_overall", framework: "site_integrity", policyKey: SITE_INTEGRITY_SCORE_POLICY_KEY,
    policyVersion: SITE_INTEGRITY_POLICY_VERSION, reasonCode: "verified_hidden_outbound_links",
    deductionPoints: hiddenLinkDeduction(observedActivity.length), observedActivity,
    evidenceRefs: [`${projection.scanId}:${projection.evidenceRef}`, `sha256:${projection.sourceHash}`, `sha256:${projection.observationHash}`] }];
}

export const siteIntegrityScoreEffectSchema = z.object({
  appliesTo: z.literal("certscore_overall"), framework: z.literal("site_integrity"),
  policyKey: z.literal(SITE_INTEGRITY_SCORE_POLICY_KEY), policyVersion: z.literal(SITE_INTEGRITY_POLICY_VERSION),
  reasonCode: z.literal("verified_hidden_outbound_links"), deductionPoints: z.number().int().min(rule.points).max(SCORING_FAMILIES.site_integrity.cap),
  observedActivity: z.array(z.string()).min(1).max(SITE_INTEGRITY_LIMITS.retainedLinks), evidenceRefs: z.array(z.string().min(1)).min(3),
}).superRefine((effect, ctx) => {
  const identities = new Set(effect.observedActivity);
  if (identities.size !== effect.observedActivity.length || hiddenLinkDeduction(identities.size) !== effect.deductionPoints ||
      effect.observedActivity.some(identity => { try {
        const value = JSON.parse(identity);
        return !Array.isArray(value) || value.length !== 3 || value.some(part => typeof part !== "string" || !part) || !/^site_integrity:link:\d{1,6}$/.test(value[2]);
      } catch { return true; } })) ctx.addIssue({code: z.ZodIssueCode.custom, message: "Invalid scored link identities"});
});

/** Union policy-approved identities; apply the first-link allowance and cap once per report. */
export function siteIntegrityDeduction(effects: readonly unknown[]) {
  const identities = new Set<string>();
  for (const effect of effects) {
    const parsed = siteIntegrityScoreEffectSchema.safeParse(effect);
    if (parsed.success) for (const identity of parsed.data.observedActivity) identities.add(identity);
  }
  return hiddenLinkDeduction(identities.size);
}
export function siteIntegrityScoreDescription(effects: readonly unknown[]) {
  const points = siteIntegrityDeduction(effects);
  return points ? `${points}-point score deduction: ${rule.identity!.first} for the first hidden link, ${rule.identity!.subsequentEach} for each additional link, capped at ${SCORING_FAMILIES.site_integrity.cap}.` : "No scored hidden-link evidence under the current policy.";
}
