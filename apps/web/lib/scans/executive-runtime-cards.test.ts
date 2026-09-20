import test from "node:test";
import assert from "node:assert/strict";
import { projectExecutiveRuntimeCards, projectSiteExecutiveRuntimeCards } from "./executive-runtime-cards";
const tracking = (retainedEvidence: Record<string, unknown>, assessmentStatus = "gap_observed") => ({ id: "pre_consent_third_party_tracking", status: "Gap observed", assessmentStatus, retainedEvidence });
const request = (vendorName: string, firstSeenMs = 9000) => ({ requestUrl: "https://www.google-analytics.com/g/collect", vendorName, vendorCategory: "analytics", firstSeenMs, runtimePhase: "pre_consent", evidenceRefs: ["request-1"] });

test("counts verified integrations once, never font timestamps or request volume", () => {
  const cards = projectExecutiveRuntimeCards([tracking({ trackingRequestTiming: { version: "classified-request-timing.v1", requests: [request("Google Analytics"), request("Google Analytics", 12000)] }, requestCount: 805, firstPreconsentThirdPartyTrackingObservedMs: 5010 })]);
  assert.equal(cards[1]!.count, 1);
  assert.equal(cards[1]!.lowerBound, true);
  assert.deepEqual(cards[1]!.vendors, ["Google Analytics"]);
  assert.equal(projectExecutiveRuntimeCards([tracking({ requestCount: 805, firstPreconsentThirdPartyTrackingObservedMs: 5010 })])[1]!.count, null);
});
test("fonts-only evidence cannot establish tracking; limited evidence cannot become zero", () => {
  const fonts = { version: "classified-request-timing.v1", requests: [{ ...request("Google Fonts"), vendorCategory: "infrastructure" }] };
  assert.equal(projectExecutiveRuntimeCards([tracking({ trackingRequestTiming: fonts })])[1]!.count, null);
  assert.equal(projectExecutiveRuntimeCards([tracking({ trackingRequestTiming: { version: "classified-request-timing.v1", requests: [request("Google Analytics")] } }, "coverage_limitation")])[1]!.count, null);
  const absent = {id: "pre_consent_third_party_tracking", assessmentStatus: "checked", status: "Not observed"};
  assert.equal(projectExecutiveRuntimeCards([absent])[1]!.count, 0);
  assert.equal(projectExecutiveRuntimeCards([absent], true)[1]!.count, null);
  assert.equal(projectExecutiveRuntimeCards([])[1]!.state, "not_confirmed");
});
test("storage identity deduplication and frame lower bounds exclude repeated captures", () => {
  const storage = {name: "_ga", storageType: "cookie", domain: "example.test", path: "/", partitionKey: null};
  const cards = projectExecutiveRuntimeCards([
    {id: "pre_consent_cookies_storage", assessmentStatus: "gap_observed", status: "Gap observed", retainedEvidence: {eligiblePreconsentCookieStorageRows: [storage, storage]}},
    {id: "third_party_iframe_pre_consent", assessmentStatus: "review_signal", status: "Review signal", retainedEvidence: {embeddedContentHosts: ["www.facebook.com", "www.facebook.com"], iframeObservationCount: 13}},
  ]);
  assert.equal(cards[0]!.count, 1);
  assert.equal(cards[0]!.lowerBound, false);
  assert.equal(cards[2]!.count, 1);
  assert.equal(cards[2]!.lowerBound, true);
  assert.equal(cards[2]!.state, "review");
});
test("site summary consumes persisted canonical findings with their assessment states", () => {
  const cards = projectSiteExecutiveRuntimeCards({limitedPages: 0, evidencePages: [{rows: [tracking({})]}], priorityReview: [{ evidenceJson: { criticalEvidence: [{rowId: "pre_consent_third_party_tracking", retainedEvidence: {trackingRequestTiming: {version: "classified-request-timing.v1", requests: [request("Google Analytics")]}}}] } }]});
  assert.equal(cards[1]!.count, 1);
  assert.equal(cards[0]!.count, null);
});


test("missing page assessments cannot produce a sitewide zero", () => {
  const cards = projectSiteExecutiveRuntimeCards({ limitedPages: 0, priorityReview: [], evidencePages: [
    { rows: [{ id: "pre_consent_cookies_storage", assessmentStatus: "checked", status: "Not observed" }] }, { rows: [] },
  ] });
  assert.equal(cards[0]!.count, null);
  assert.equal(cards[0]!.state, "not_confirmed");
});
