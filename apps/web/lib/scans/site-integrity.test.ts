import { buildSitePriorityReview } from "./full-site-priority-review";
import assert from "node:assert/strict";
import test from "node:test";
import { SITE_INTEGRITY_FINDING_ID } from "@certscore/contracts";
import { getReportUnifiedFinding } from "@website-signal-risk-scanner/shared";
import { siteIntegrityObservationFixture as observation, siteIntegrityProjectionFixture as integrityProjectionFixture } from "../../../../packages/certscore-contracts/src/site-integrity.fixture";
import { buildNormalizedConcerns, normalizeConcernFromReviewFindingCandidate } from "./normalized-concerns";
import { buildUnifiedFindingDisplayPackets } from "./unified-findings";
import { selectSiteIntegrityFinding } from "./site-integrity-report";
import { deriveCanonicalOverallScoreForReport } from "../../server/scans/canonical-overall-score";
import { filterVisibleExecutiveTopFindings } from "./executive-top-finding-visibility";
import type { GdprEprivacyCoverageChecklistItem } from "./gdpr-eprivacy-coverage-checklist";

export function integrityPacketsFixture() {
  return buildUnifiedFindingDisplayPackets({ runtimeArtifacts: { siteIntegrity: integrityProjectionFixture },
    reviewFindingCandidates: [], validationFindings: [], validationFindingLookup: new Map() });
}

test("verified integrity evidence flows through concern policy and unified finding with an overall score effect and no regulatory conclusion", () => {
  const concerns = buildNormalizedConcerns({ runtimeArtifacts: { siteIntegrity: integrityProjectionFixture }, reviewFindingCandidates: [], validationFindings: [] });
  const concern = concerns.find(row => row.suggestedUnifiedFindingId === SITE_INTEGRITY_FINDING_ID);
  assert.ok(concern);
  assert.equal(concern.promotionEligibility, "eligible");
  assert.equal(concern.regulatoryChecklistEligibility, "none");
  assert.equal(concern.scoreEffects?.[0]?.deductionPoints, 27);
  const packets = integrityPacketsFixture();
  const finding = selectSiteIntegrityFinding(packets);
  assert.ok(finding, JSON.stringify(packets));
  assert.equal(finding.severity, "high");
  assert.equal(packets[0]?.severity, "high");
  assert.deepEqual(finding.evidence.observation, observation);
  assert.equal(packets[0]?.surfacingDecision.decisionState, "review");
  assert.deepEqual(getReportUnifiedFinding(SITE_INTEGRITY_FINDING_ID)?.categoryAlignments,
    [{ evidenceCategoryId: "site_integrity_observations", relation: "owner" }]);
  assert.deepEqual(filterVisibleExecutiveTopFindings([{ id: SITE_INTEGRITY_FINDING_ID }]), []);
  const checklistRows = [{ assessmentStatus: "checked", criticalEvidence: { retainedEvidence: { consentSurfaceObserved: true } },
    evidenceState: "observed", id: "consent_surface_observed", status: "Observed" }] as unknown as GdprEprivacyCoverageChecklistItem[];
  const score = (unifiedFindings: typeof packets) => deriveCanonicalOverallScoreForReport({ scanRecord: { runtimeArtifacts: null }, checklistRows, unifiedFindings });
  assert.equal(score([]), 100);
  assert.equal(score(packets), 73);
});

test("raw flags, missing evidence, and empty or malformed captures never become integrity findings", () => {
  for (const siteIntegrity of [undefined, { hiddenLinks: true }, { ...integrityProjectionFixture, sourceHash: "bad" },
    { ...integrityProjectionFixture, observation: { ...observation, links: [] } }]) {
    const packets = buildUnifiedFindingDisplayPackets({ runtimeArtifacts: { siteIntegrity }, reviewFindingCandidates: [], validationFindings: [], validationFindingLookup: new Map() });
    assert.equal(selectSiteIntegrityFinding(packets), null);
  }
  const spoof = normalizeConcernFromReviewFindingCandidate({ title: "Hidden outbound links", description: "Guessed", severity: "high", sourceType: "issue", observedValue: null,
    fallbackEvidence: { unifiedFindingId: SITE_INTEGRITY_FINDING_ID, hiddenLinks: true } });
  assert.equal(spoof.promotionEligibility, "blocked");
});

test("eligible unified integrity joins priority review once, scoped to its retained starting page", () => {
 const pages = [{id:"home",url:observation.documentUrl,homepage:true,findingIds:[]}, {id:"other",url:"https://example.com/other",homepage:false,findingIds:[]}];
 const packets = integrityPacketsFixture();
 const priorities = buildSitePriorityReview([], pages, [], [...packets, ...packets]);
 assert.equal(priorities.length, 1);
 assert.equal(priorities[0]?.id, SITE_INTEGRITY_FINDING_ID);
 assert.equal(priorities[0]?.status, "Partial concern");
 assert.equal(priorities[0]?.priority, "high");
 assert.deepEqual(priorities[0]?.pages.map(page => page.id), ["home"]);
 assert.match(priorities[0]!.evidence.join(" "), /27-point score deduction/);
 assert.deepEqual(buildSitePriorityReview([], pages, [], []), []);
 assert.deepEqual(buildSitePriorityReview([], pages, [], packets.map(packet => ({...packet, presentationDecision: {...packet.presentationDecision, status:"suppress"}}))), []);
});

test("site link counts deduplicate pages and local references without conflating destinations", async () => {
  const { summarizeSiteIntegrityLinks, projectSiteIntegritySitePriority } = await import("./site-integrity-report");
  const finding = selectSiteIntegrityFinding(integrityPacketsFixture())!;
  const report = { findings: [finding, finding], coverage: [{pageId:"home",url:observation.documentUrl,homepage:true,status:"captured" as const}] };
  const count = new Set(observation.links.map(link => link.evidenceRef)).size;
  assert.deepEqual(summarizeSiteIntegrityLinks(report), {count,pages:1,lowerBound:false});
  assert.match(projectSiteIntegritySitePriority(report)!.summary, new RegExp(`${count} hidden outbound link occurrences`));
  assert.equal(summarizeSiteIntegrityLinks({...report,coverage:[{...report.coverage[0]!,status:"unavailable"}]}).lowerBound,true);
  assert.equal(summarizeSiteIntegrityLinks({findings:[],coverage:[]}).count,null);
});


test("high-priority site integrity ranks ahead of existing privacy findings", () => {
 const rows = [{id:"third_party_iframe_pre_consent", label:"Third-party embeds before consent",assessmentStatus:"gap_observed",status:"Gap observed",evidenceState:"observed",evidenceRefs:[],criticalEvidence:{retainedEvidence:{},missingOrIncompleteSourceSignals:[],projectedFindings:[]}}] as unknown as GdprEprivacyCoverageChecklistItem[];
 const findings = buildSitePriorityReview(rows,[{id:"home",url:observation.documentUrl,homepage:true,findingIds:["third_party_iframe_pre_consent"]}],[],integrityPacketsFixture());
 assert.ok(findings.length > 1);
 assert.equal(findings[0]?.id,SITE_INTEGRITY_FINDING_ID);
 assert.equal(findings[0]?.priority,"high");
 assert.deepEqual(findings.map(row=>row.rank),findings.map((_,index)=>index+1));
});

test("verified empty capture displays zero without manufacturing an integrity finding", async () => {
  const { projectStartingPageSiteIntegrityReport, summarizeSiteIntegrityLinks } = await import("./site-integrity-report");
  const zero = {...integrityProjectionFixture, observation: {...observation, links: []}};
  const report = projectStartingPageSiteIntegrityReport(zero, [])!;
  assert.deepEqual(report.findings, []);
  assert.equal(summarizeSiteIntegrityLinks(report).count, 0);
  assert.equal(summarizeSiteIntegrityLinks({...report, coverage: [...report.coverage, {...report.coverage[0]!,pageId:"other"}]}).count, 0);
  for (const state of ["limited", "unavailable"] as const) {
    assert.equal(summarizeSiteIntegrityLinks({...report, coverage:[{...report.coverage[0]!,status:state}]}).count, null);
  }
  assert.equal(projectStartingPageSiteIntegrityReport({...zero, verificationStatus:"unverified"}, []), undefined);
  assert.equal(projectStartingPageSiteIntegrityReport(undefined, []), undefined);
  assert.equal(summarizeSiteIntegrityLinks({...report,coverage:[{...report.coverage[0]!,retainedLinkCount:undefined}]}).count,null);
});
