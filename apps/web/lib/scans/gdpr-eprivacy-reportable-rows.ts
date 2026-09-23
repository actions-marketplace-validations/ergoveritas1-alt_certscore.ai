import { choicePathExecutionSchema } from "@certscore/contracts";
import { isAfterActionReportEligible } from "./after-action-report-eligibility";

import type { GdprEprivacyCoverageChecklistItem } from "./gdpr-eprivacy-coverage-checklist";

const DEFERRED_NON_PRODUCTION_ROW_IDS = new Set([
  "advertising_retargeting_vendor_signal_observed",
  "analytics_vendor_observed",
  "preference_withdrawal_control",
  "public_collection_surfaces",
  "retargeting_behavioral_advertising_signal_observed",
  "sensitive_surfaces_third_party_tracking",
  "cross_border_endpoint_review",
  "accessibility_consent_controls",
  // Consent-choice quality remains retained internal evidence, but the
  // umbrella checklist row is not a reportable finding. Specific observed
  // consent-control findings remain eligible independently.
  "consent_choice_quality"
]);

export function isReportableGdprEprivacyCoverageRowId(id: string) {
  return !DEFERRED_NON_PRODUCTION_ROW_IDS.has(id);
}

type GdprEprivacyReportabilityContext = {
  consentControlAssessment?: unknown;
  postRefusalEvidenceProjection?: unknown;
};

function isIrrelevantPostRejectAssessment(
  item: GdprEprivacyCoverageChecklistItem,
  context?: GdprEprivacyReportabilityContext,
) {
  if (item.id !== "post_reject_tracking_reduction") return false;
  const retained = item.criticalEvidence.retainedEvidence;
  // This execution is retained by canonical checklist construction; it cannot
  // manufacture a finding or relabel the passive control inventory.
  const execution = choicePathExecutionSchema.safeParse(retained.execution);
  if (execution.success && execution.data.clickCompleted) return false;
  if (isAfterActionReportEligible(undefined, "reject", context?.postRefusalEvidenceProjection)) return false;
  return retained.reportPresentation === "omit_no_actionable_reject_control" ||
    (context?.consentControlAssessment !== undefined
      ? !isAfterActionReportEligible(context.consentControlAssessment, "reject")
      : retained.reportControlObserved !== true);
}

export function getReportableGdprEprivacyCoverageItems(
  items: GdprEprivacyCoverageChecklistItem[],
  context?: GdprEprivacyReportabilityContext,
) {
  return items.filter((item) =>
    isReportableGdprEprivacyCoverageRowId(item.id) &&
    !isIrrelevantPostRejectAssessment(item, context)
  ).map(item => item.id === "post_reject_tracking_reduction" &&
    isAfterActionReportEligible(context?.consentControlAssessment, "reject")
    ? { ...item, criticalEvidence: { ...item.criticalEvidence, retainedEvidence: {
        ...item.criticalEvidence.retainedEvidence, reportControlObserved: true,
      } } }
    : item);

}
