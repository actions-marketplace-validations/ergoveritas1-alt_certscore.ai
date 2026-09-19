import assert from "node:assert/strict";
import test from "node:test";
import { assessCmsSignals, type CmsSignal, type CollectionSurfaceAssessment } from "@certscore/contracts";
import { siteIntegrityProjectionFixture } from "../../../../packages/certscore-contracts/src/site-integrity.fixture";
import { SCAN_REPORT_PROJECTION_VERSION } from "../scans/scan-report-projection-contract";
import { projectAdminScanInventory } from "./admin-scan-inventory";

const ready = { report_projection_status: "ready", report_projection_version: SCAN_REPORT_PROJECTION_VERSION, report_projection_computed_at: "2026-09-19T00:00:00.000Z" };
function forms(): CollectionSurfaceAssessment {
  return {
    contractVersion: "certscore.collection-surface-assessment.v1", scanId: "fixture", assessedAt: ready.report_projection_computed_at,
    assessmentStatus: "not_observed", sourceInventoryContractVersion: "certscore.collection-surface-inventory.v1", sourceHash: "a".repeat(64),
    sourceLane: "runtime_evidence", pageUrl: "https://clinic.example/", productionProjectable: true, forms: [], limitationKeys: [], evidenceRefs: [],
    coverage: { status: "complete", documentScope: "main_document", interactionMode: "none", candidateFormCount: 0, retainedFormCount: 0,
      candidateFieldCount: 0, retainedFieldCount: 0, inspectedFormCandidateCount: 0, inspectedFieldCandidateCount: 0,
      candidateScanTruncated: false, retentionTruncated: false, reasonCodes: [] },
  };
}
function cms(generators: string[]) {
  const signals: CmsSignal[] = generators.map((value, i) => ({ evidenceRef: `site_integrity:dom:${i}`, kind: "meta_generator", value, sourceUrl: "https://clinic.example/", artifactRef: "runtime:dom:1" }));
  return { contractVersion: "certscore.cms-security-projection.v1", scanId: "fixture", verificationStatus: "verified", sourceHash: "a".repeat(64),
    documentUrl: "https://clinic.example/", documentToken: "document-fixture", capturedAt: ready.report_projection_computed_at, evidenceRef: "runtime:dom:1",
    signals, assessment: assessCmsSignals(signals, ready.report_projection_computed_at) };
}
const empty = { hiddenLinks: null, forms: null, cms: null };

test("admin inventory distinguishes missing evidence from verified zero counts and no CMS detection", () => {
  assert.deepEqual(projectAdminScanInventory("fixture", ready, false), empty);
  const integrity = { ...siteIntegrityProjectionFixture, observation: { ...siteIntegrityProjectionFixture.observation, links: [] } };
  assert.deepEqual(projectAdminScanInventory("fixture", { ...ready, admin_site_integrity: integrity, admin_collection_surfaces: forms(), admin_cms_security: cms([]) }, false),
    { hiddenLinks: { count: 0, limited: false }, forms: { count: 0, limited: false }, cms: "Not detected" });
});

test("admin inventory retains occurrence counts and incomplete capture without inventing absence", () => {
  const assessment = forms();
  assessment.assessmentStatus = "limited";
  const result = projectAdminScanInventory("fixture", { ...ready,
    admin_site_integrity: { ...siteIntegrityProjectionFixture, observation: { ...siteIntegrityProjectionFixture.observation, truncated: true } },
    admin_collection_surfaces: assessment }, false);
  assert.deepEqual(result.hiddenLinks, { count: 3, limited: true });
  assert.deepEqual(result.forms, { count: 0, limited: true });
  assessment.assessmentStatus = "not_testable";
  assert.equal(projectAdminScanInventory("fixture", { ...ready, admin_collection_surfaces: assessment }, false).forms, null);
});

test("form count uses retained surfaces rather than candidate or field counts", () => {
  const assessment = forms();
  assessment.assessmentStatus = "observed";
  assessment.forms = [{ formRef: "form-0", structure: "native_form", surfaceType: "contact", pageUrl: "https://clinic.example/",
    method: "post", actionRelationship: "self", candidateFieldCount: 0, retainedFieldCount: 0, fieldsTruncated: false,
    fields: [], evidenceRefs: [], confidence: 1, directVsInferred: "direct" }];
  assessment.coverage = { ...assessment.coverage!, retainedFormCount: 1, candidateFormCount: 3, inspectedFormCandidateCount: 3, retentionTruncated: true };
  assert.deepEqual(projectAdminScanInventory("fixture", { ...ready, admin_collection_surfaces: assessment }, false).forms, { count: 1, limited: true });
});

test("no-go, stale, malformed and cross-scan projections fail closed", () => {
  const snapshot = { ...ready, admin_site_integrity: siteIntegrityProjectionFixture, admin_collection_surfaces: forms(), admin_cms_security: cms(["WordPress 6.8.1"]) };
  assert.deepEqual(projectAdminScanInventory("fixture", snapshot, true), empty);
  assert.deepEqual(projectAdminScanInventory("other", snapshot, false), empty);
  assert.deepEqual(projectAdminScanInventory("fixture", { ...snapshot, report_projection_status: "pending" }, false), empty);
  assert.deepEqual(projectAdminScanInventory("fixture", { ...snapshot, report_projection_version: "unsupported" }, false), empty);
  assert.deepEqual(projectAdminScanInventory("fixture", { ...ready, admin_site_integrity: {}, admin_collection_surfaces: {}, admin_cms_security: {} }, false), empty);
});

test("CMS labels preserve declared, unknown and conflicting versions", () => {
  for (const [generators, expected] of [
    [["WordPress 6.8.1"], "WordPress 6.8.1"],
    [["WordPress"], "WordPress (version unknown)"],
    [["WordPress 6.8.1", "WordPress 6.8.2"], "WordPress 6.8.1 / 6.8.2 (conflicting)"],
  ] as const) {
    assert.equal(projectAdminScanInventory("fixture", { ...ready, admin_cms_security: cms([...generators]) }, false).cms, expected);
  }
});
