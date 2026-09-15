import { consentControlAssessmentSchema } from "@certscore/contracts";

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

/** Reporting only. Worker dispatch, retained action evidence, findings and
 * scoring are unchanged. A limited inspection can still positively observe
 * one control; unknown and not_observed never authorize its report section. */
export function isAfterActionReportEligible(assessment: unknown, action: "accept" | "reject"): boolean {
  const parsed = consentControlAssessmentSchema.safeParse(assessment);
  return parsed.success && parsed.data.controls[action].state === "observed";
}

export function retainedConsentAssessment(value: unknown): unknown {
  const root = record(value);
  const snapshot = record(root?.snapshot);
  const runtime = record(root?.runtimeArtifacts) ?? root;
  const hybrid = record(runtime?.hybridRuntimeEvidence) ?? record(runtime?.hybrid_runtime_evidence);
  return snapshot?.consentControlAssessment ?? snapshot?.consent_control_assessment ??
    runtime?.consentControlAssessment ?? runtime?.consent_control_assessment ??
    hybrid?.consentControlAssessment ?? hybrid?.consent_control_assessment;
}
