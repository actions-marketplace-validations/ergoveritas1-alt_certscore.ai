import assert from "node:assert/strict";
import test from "node:test";
import { isAfterActionReportEligible } from "./after-action-report-eligibility";
import { completedActionProjection } from "./test-fixtures/action-execution-projection";
import { observedControlAssessment } from "./test-fixtures/observed-control-assessment";
import { readChoicePathExecution } from "./choice-path-execution";
import { getReportableGdprEprivacyCoverageItems } from "./gdpr-eprivacy-reportable-rows";
import type { GdprEprivacyCoverageChecklistItem } from "./gdpr-eprivacy-coverage-checklist";

for (const action of ["accept", "reject"] as const) {
  test(`${action}: an independently verified action remains reportable without a passive control`, () => {
    const projection = completedActionProjection(action);
    const before = structuredClone(projection);
    for (const state of ["not_observed", "unknown"]) {
      const assessment = { ...observedControlAssessment, assessmentStatus: "limited", controls: {
        ...observedControlAssessment.controls, [action]: { ...observedControlAssessment.controls[action], state },
      } };
      assert.equal(isAfterActionReportEligible(assessment, action), false);
      assert.equal(isAfterActionReportEligible(assessment, action, projection), true);
      assert.equal(assessment.controls[action].state, state);
    }
    assert.deepEqual(projection, before);
    assert.equal(projection.productionProjectable, false);
    for (const bad of [undefined, {}, { execution: readChoicePathExecution(projection, action) },
      { ...projection, packetSha256: undefined },
      { ...projection, afterActionCapture: { ...projection.afterActionCapture, activationStatus: "uncertain", stopReason: "click_uncertain" } },
      completedActionProjection(action === "accept" ? "reject" : "accept")]) {
      assert.equal(isAfterActionReportEligible(undefined, action, bad), false);
    }
  });
}

test("canonical checklist execution keeps an existing Reject row visible without inventing passive observation", () => {
  const projection = completedActionProjection("reject");
  const row = { id: "post_reject_tracking_reduction", criticalEvidence: { retainedEvidence: {
    reportControlObserved: false, reportPresentation: "omit_no_actionable_reject_control",
    execution: readChoicePathExecution(projection, "reject"),
  } } } as unknown as GdprEprivacyCoverageChecklistItem;
  assert.deepEqual(getReportableGdprEprivacyCoverageItems([row]), [row]);
  assert.equal(row.criticalEvidence.retainedEvidence.reportControlObserved, false);
  const missing = { ...row, criticalEvidence: { retainedEvidence: { reportControlObserved: false } } } as unknown as GdprEprivacyCoverageChecklistItem;
  assert.deepEqual(getReportableGdprEprivacyCoverageItems([missing]), []);
  assert.deepEqual(getReportableGdprEprivacyCoverageItems([missing], { postRefusalEvidenceProjection: projection }), [missing]);
});
