import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getGdprEprivacyRowDeduction } from "./regulatory-coverage-score";
import { deriveConcernPolicy } from "./concern-policy";
import { buildScanReportUnifiedFindingState } from "./scan-report-unified-findings";
import { deriveGdprEprivacyCoverageChecklist } from "./gdpr-eprivacy-coverage-checklist";
import { projectExecutiveFindingsFromUnifiedPackets } from "./executive-findings-projection";

const fixtures = JSON.parse(readFileSync(new URL("./test-fixtures/limited-reject-assessment-cohort.json", import.meta.url), "utf8"));
const absenceIds = ["reject_button_missing", "accept_more_prominent_than_reject"];
function build(fixture: typeof fixtures[number], assessment: unknown) {
  return buildScanReportUnifiedFindingState({
    accessibilityRuleCounts: [], accessibilityRuleExamples: [], events: [], macroEnrichment: null,
    mergedSignals: [], pageEvidence: [], policyEnrichment: [], policyReviewQueue: [], preconsentViolations: [],
    primaryPolicyEnrichment: null,
    runtimeArtifacts: { consentControlAssessment: assessment, consent_surface_observed: true,
      consent_actionable_choice_observed: true, reject_path_depth_and_availability: fixture.rejectPath },
    scan: {}, signalHits: [], signals: [],
    snapshot: { final_url: fixture.consentAssessment.scan.finalUrl, registered_domain: fixture.hostname },
    trackerVendors: [], validationFindings: []
  } as never, {
    deriveAccessibilityIssueRows: () => [], deriveAccessibilityRuleEvidenceRows: () => [],
    deriveConsentAuditFindings: () => [], derivePolicyBehaviorContradictions: () => [],
    derivePreconsentViolationRows: () => [], filterContradictoryPositiveSurfaceFindings: findings => findings
  });
}
// Persisted September 14 cohort evidence; these are scan observations, not live-site assertions.
for (const fixture of fixtures) {
  test(`${fixture.hostname}: limited Reject inventory cannot become an absence finding`, () => {
    const legacy = build(fixture, undefined);
    assert.ok(legacy.globalUnifiedFindings.some(f => f.unifiedFindingId === "reject_button_missing"), "fixture reproduces compatibility-path promotion");
    const state = build(fixture, fixture.consentAssessment);
    assert.equal(state.globalUnifiedFindings.some(f => absenceIds.includes(f.unifiedFindingId)), false);
    assert.ok(state.normalizedConcerns);
    const blocked = state.normalizedConcerns.filter(c => absenceIds.includes(c.suggestedUnifiedFindingId ?? ""));
    assert.ok(blocked.length > 0);
    assert.ok(blocked.every(c => c.promotionEligibility === "blocked"));
    const checklist = deriveGdprEprivacyCoverageChecklist({ coverageLimited: true, coverageOutcomes: {},
      projectedFindings: [], scanCompleted: true, unifiedFindings: state.globalUnifiedFindings });
    const rejectRow = checklist.find(r => r.id === "reject_all_path_availability");
    assert.ok(rejectRow);
    assert.notEqual(rejectRow.status, "Gap observed");
    assert.equal(getGdprEprivacyRowDeduction(rejectRow), 0);
    const executive = projectExecutiveFindingsFromUnifiedPackets(state.globalUnifiedFindings);
    assert.equal(executive.findings.some(f => ["reject_option_missing_or_hidden", "asymmetric_consent_ui"].includes(f.id)), false);
  });
}
test("complete canonical absence preserves the supported finding", () => {
  const fixture = fixtures[0];
  const assessment = structuredClone(fixture.consentAssessment);
  assessment.assessmentStatus = "complete";
  assessment.coverage.status = "complete";
  assessment.controls.reject.state = "not_observed";
  const state = build(fixture, assessment);
  assert.ok(state.globalUnifiedFindings.some(f => f.unifiedFindingId === "reject_button_missing"));
});
test("malformed canonical assessment blocks compatibility-path absence", () => {
  for (const invalid of [null, { artifactVersion: "2.1" }]) {
    const state = build(fixtures[0], invalid);
    assert.equal(state.globalUnifiedFindings.some(f => absenceIds.includes(f.unifiedFindingId)), false);
  }
});
test("observed Reject contradicts missing Reject without vetoing visual comparison", () => {
  const fixture = fixtures[0];
  const assessment = structuredClone(fixture.consentAssessment);
  assessment.controls.reject.state = "observed";
  const state = build(fixture, assessment);
  assert.equal(state.globalUnifiedFindings.some(f => f.unifiedFindingId === "reject_button_missing"), false);
  const policy = deriveConcernPolicy({
    consentControlAssessment: assessment,
    concern: { canonicalConcernKey: "visual-comparison", originKey: "visual-comparison", originType: "runtime_artifact",
      policyIsPrimarySource: false, policyPageType: null, suggestedUnifiedFindingId: "accept_more_prominent_than_reject", title: "Visual comparison" },
    evidenceStrengthFlags: ["direct_runtime"], rawEvidence: {}
  });
  assert.equal(policy.negativeEvidenceFlags.includes("canonical_consent_control_evidence_insufficient"), false);
});

for (const limitation of ["document_mismatch", "no_go"]) {
  test(`${limitation} cannot promote canonical absence`, () => {
    const assessment = structuredClone(fixtures[0].consentAssessment);
    assessment.assessmentStatus = "complete";
    assessment.coverage.status = "complete";
    assessment.controls.reject.state = "not_observed";
    if (limitation === "document_mismatch") assessment.document.identityStatus = "mismatched";
    else assessment.scan.noGo = true;
    assert.equal(build(fixtures[0], assessment).globalUnifiedFindings.some(f => absenceIds.includes(f.unifiedFindingId)), false);
  });
}
