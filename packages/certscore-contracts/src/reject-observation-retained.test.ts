import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { consentControlAssessmentSchema } from "./consent-control-assessment";
import { classifyConsentControlLabel } from "./consent-control-label-classifier";
import { classifyConsentInspectionRole } from "./consent-control-inspection";

const corpus = JSON.parse(readFileSync(__dirname + "/../fixtures/reject-observation-retained-20260914.json", "utf8"));
test("all 26 retained unknown cases and known controls preserve their historical conclusions", () => {
  assert.equal(corpus.cases.filter((c: any) => c.kind === "retained_unknown").length, 26);
  assert.equal(corpus.cases.filter((c: any) => c.kind === "known_observed").length, 37);
  for (const c of corpus.cases) {
    const parsed = consentControlAssessmentSchema.parse(c.assessment);
    assert.deepEqual(parsed, c.assessment, c.host);
    assert.equal(parsed.artifactVersion, "2.1");
  }
  const joybuy = corpus.cases.find((c: any) => c.host === "joybuy.nl");
  assert.ok(joybuy);
  assert.equal(joybuy.assessment.controls.reject.state, "unknown");
  assert.equal(joybuy.assessment.document.identityStatus, "mismatched");
});
test("five reviewed refusal labels are recovered from the actual retained visible and accessible fields", () => {
  for (const [host, label] of [["unsw.edu.au", "Accept only essential"], ["uni-kiel.de", "NUR ESSENTIELLE COOKIES AKZEPTIEREN"], ["www.fp-finanzpartner.de", "Nein Danke."], ["botfaqtor.ru", "Отказаться"], ["joybuy.nl", "Alles afwijzen"]] as const) {
    const row = corpus.cases.find((c: any) => c.host === host);
    const candidate = row?.geometryCandidates.find((c: any) => c.label.toLocaleLowerCase() === label.toLocaleLowerCase());
    assert.ok(candidate, `${host}: retained candidate`);
    const input = { ...candidate, hasConsentContext: candidate.consentContextConfirmed, usage: "observation" as const };
    assert.equal(classifyConsentControlLabel(input).intent, "reject", host);
    assert.equal(classifyConsentControlLabel({ ...input, usage: "action" }).intent, "unknown", `${host}: action remains unauthorized by new vocabulary`);
  }
});
test("retained partner-list candidates have scoped vendor roles; historical absence is not invented", () => {
  for (const host of ["naszemiasto.pl", "marinetraffic.com"]) {
    const row = corpus.cases.find((c: any) => c.host === host);
    const candidate = row.geometryCandidates.find((c: any) => /^(partners|nasi partnerzy)/i.test(c.label));
    assert.ok(candidate, host);
    assert.equal(classifyConsentInspectionRole(candidate).role, "vendor_list", host);
    assert.equal(row.assessment.controls.reject.state, "unknown", "new full structural coverage was not retained historically");
  }
});
