import { readChoicePathExecution } from "./choice-path-execution";
import { consentControlAssessmentSchema } from "@certscore/contracts";

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

/** Reporting only. A verified completed action in its independent session is
 * reportable even when the passive session saw no control. This does not change
 * passive A/R/O, finding eligibility, consent registration or scoring. */
export function isAfterActionReportEligible(assessment: unknown, action: "accept" | "reject", projection?: unknown): boolean {
  if (readChoicePathExecution(projection, action)?.clickCompleted === true) return true;
  const parsed = consentControlAssessmentSchema.safeParse(assessment);
  return parsed.success && parsed.data.controls[action].state === "observed";
}

export function retainedActionProjection(value: unknown, action: "accept" | "reject"): unknown {
  const root = record(value);
  const runtime = record(root?.runtimeArtifacts) ?? root;
  return action === "accept"
    ? runtime?.postAcceptEvidenceProjection ?? runtime?.post_accept_evidence_projection
    : runtime?.postRefusalEvidenceProjection ?? runtime?.post_refusal_evidence_projection;
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
