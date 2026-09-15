import assert from "node:assert/strict";
import test from "node:test";
import { classifyConsentInspectionRole, isControlInspectionComplete, isInitialNecessaryOnlySelection, verifyConsentControlInspection, CONTROL_INSPECTION_POLICY } from "./consent-control-inspection";

test("information can leave Options limited while Reject inspection is complete", () => {
  const role = classifyConsentInspectionRole({ label: "More information", actionType: "other", tagName: "button", consentContextConfirmed: true });
  const proof = { version: CONTROL_INSPECTION_POLICY, structuralCoverage: "complete" as const, retainedCandidateCount: 1, captureCoverage: { inventoryTruncated: false, documentReadyState: "complete" as const, mainFrameAvailable: true, documentAndFramesStable: true, frameCount: 1, capturedFrameCount: 1 }, reasonCodes: [], candidates: [{ candidateId: "details", ...role }] };
  assert.equal(isControlInspectionComplete(proof, "reject"), true);
  assert.equal(isControlInspectionComplete(proof, "options"), false);
  assert.equal(isControlInspectionComplete({ ...proof, structuralCoverage: "limited" }, "reject"), false);
});

test("inspection proof rejects missing, duplicated and reclassified retained candidates", () => {
  const candidate = { candidateId: "unknown", label: "Untranslated", actionType: "other", consentContextConfirmed: true,
    layer: "first_layer", enabled: true, intersectsViewport: true, boundingBox: { width: 100, height: 30 }, decisionStatus: "ambiguous" };
  const proof = { version: CONTROL_INSPECTION_POLICY, structuralCoverage: "complete", retainedCandidateCount: 1, captureCoverage: { inventoryTruncated: false, documentReadyState: "complete" as const, mainFrameAvailable: true, documentAndFramesStable: true, frameCount: 1, capturedFrameCount: 1 }, reasonCodes: [],
    candidates: [{ candidateId: candidate.candidateId, ...classifyConsentInspectionRole(candidate) }] };
  assert.ok(verifyConsentControlInspection(proof, [candidate]));
  assert.equal(verifyConsentControlInspection(proof, undefined), null);
  assert.equal(verifyConsentControlInspection({ ...proof, candidates: [] }, [candidate]), null);
  assert.equal(verifyConsentControlInspection({ ...proof, candidates: [proof.candidates[0], proof.candidates[0]] }, [candidate]), null);
  assert.equal(verifyConsentControlInspection({ ...proof, candidates: [{ candidateId: "unknown", role: "information", unresolvedIntents: [] }] }, [candidate]), null);
  const empty = { ...proof, retainedCandidateCount: 0, candidates: [] };
  assert.ok(verifyConsentControlInspection(empty, []));
  assert.equal(verifyConsentControlInspection(empty, [candidate]), null);
});
test("vendor information requires registered structural context; arbitrary partner buttons stay unresolved", () => {
  for (const [label, selectorHint] of [["partners", "div.qc-cmp2-summary-info button"], ["nasi partnerzy (1100)", "div.didomi-popup-notice-text a"]]) {
    assert.equal(classifyConsentInspectionRole({ label, selectorHint, consentContextConfirmed: true }).role, "vendor_list");
    assert.equal(classifyConsentInspectionRole({ label, selectorHint: "#unrelated", consentContextConfirmed: true }).role, "unknown");
  }
});
test("initial necessary-only recipe requires complete, unique optional-off state", () => {
  const proof = { recipe: "drupal_eu_cookie_compliance.initial_selection.v1", scopeSelector: "#sliding-popup .eu-cookie-compliance-banner",
    submitSelector: ".eu-cookie-compliance-categories-buttons .eu-cookie-compliance-save-preferences-button", complete: true,
    categories: [{ id: "mandatory", checked: true, disabled: true, inputType: "checkbox" }, { id: "statistics", checked: false, disabled: false, inputType: "checkbox" }] };
  assert.equal(isInitialNecessaryOnlySelection(proof), true);
  assert.equal(isInitialNecessaryOnlySelection({ ...proof, complete: false }), false);
  assert.equal(isInitialNecessaryOnlySelection({ ...proof, categories: [...proof.categories, proof.categories[1]] }), false);
  assert.equal(isInitialNecessaryOnlySelection({ ...proof, categories: proof.categories.map(c => ({ ...c, checked: true })) }), false);
});

test("complete structural proof is invalid when retained capture limits contradict it", () => {
  const captureCoverage = { inventoryTruncated: false, documentReadyState: "complete", mainFrameAvailable: true,
    documentAndFramesStable: true, frameCount: 1, capturedFrameCount: 1 };
  const proof = { version: CONTROL_INSPECTION_POLICY, structuralCoverage: "complete", retainedCandidateCount: 0, reasonCodes: [], candidates: [], captureCoverage };
  for (const change of [{ inventoryTruncated: true }, { documentReadyState: "loading" }, { mainFrameAvailable: false },
    { documentAndFramesStable: false }, { frameCount: 2 }, { capturedFrameCount: 0 }]) {
    assert.equal(verifyConsentControlInspection({ ...proof, captureCoverage: { ...captureCoverage, ...change } }, []), null);
  }
});
