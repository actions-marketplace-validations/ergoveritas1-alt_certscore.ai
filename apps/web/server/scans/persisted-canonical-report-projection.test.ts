import assert from "node:assert/strict";
import test from "node:test";
import { getPersistedCanonicalReportProjection } from "./persisted-canonical-report-projection";
import { observedControlAssessment } from "../../lib/scans/test-fixtures/observed-control-assessment";

test("canonical report read omits unobserved Reject results without mutating persisted diagnostics", () => {
  for (const state of ["observed", "not_observed", "unknown"]) {
    const row = { id: "post_reject_tracking_reduction", criticalEvidence: { retainedEvidence: {} } };
    const record = { scan: { id: "scan-1" }, runtimeArtifacts: { consentControlAssessment: {
      ...observedControlAssessment, controls: { ...observedControlAssessment.controls,
        reject: { ...observedControlAssessment.controls.reject, state } },
    } }, canonicalReportProjection: { artifactVersion: "persisted-canonical-report-projection-v2",
      checklistRows: [row], derivedContext: {}, globalUnifiedFindings: [], legacyScoreAssessmentInput: { scanId: "scan-1" },
      normalizedConcerns: [], ownerUnifiedFindings: [], topFindingIds: [],
    } } as any;
    const projected = getPersistedCanonicalReportProjection(record);
    assert.ok(projected);
    assert.equal(projected.checklistRows.length, state === "observed" ? 1 : 0);
    assert.equal(record.canonicalReportProjection.checklistRows.length, 1);
  }
});
