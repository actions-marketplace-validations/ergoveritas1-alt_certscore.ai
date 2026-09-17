import assert from "node:assert/strict";
import test from "node:test";
import { qualifiesSiteIntegrityReview, siteIntegrityObservationSchema, siteIntegrityProjectionSchema } from "./site-integrity";
import { siteIntegrityObservationFixture as observation } from "./site-integrity.fixture";

const projection = { contractVersion: "certscore.site-integrity-projection.v1", scanId: "fixture", sourceHash: "a".repeat(64), observationHash: "b".repeat(64), verificationStatus: "verified", evidenceRef: "CanonicalEvidenceBundle.json#siteIntegrityObservation", observation };
test("site integrity requires versioned bounded evidence for each verified hidden link, never a loose flag", () => {
  assert.equal(qualifiesSiteIntegrityReview(projection), true);
  assert.equal(qualifiesSiteIntegrityReview({ hiddenLinks: true, count: 8 }), false);
  assert.equal(qualifiesSiteIntegrityReview({ ...projection, verificationStatus: "unavailable" }), false);
  for (const links of [observation.links.slice(0, 2), observation.links.map(link => ({ ...link, destinationDomain: "same.example" })), observation.links.map(link => ({ ...link, concealment: "offscreen_position" }))]) {
    assert.equal(qualifiesSiteIntegrityReview({ ...projection, observation: { ...observation, links } }), true);
  }
});
test("site integrity rejects unsafe, oversized, duplicate or malformed evidence", () => {
  for (const change of [
    { documentUrl: "https://clinic.example/?email=private" }, { documentUrl: "javascript:alert(1)" }, { documentUrl: "not a URL" },
    { documentToken: "" }, { links: Array(13).fill(observation.links[0]) },
    { links: [observation.links[0], observation.links[0]] },
    { links: [{ ...observation.links[0], evidenceRef: "site_integrity:link:40" }] },
    { links: [{ ...observation.links[0], destinationDomain: "https://evil.example/?token=secret" }] },
    { sourceLane: "consent_proof" }, { inspectedLinks: 1001 }, { rawHtml: "unbounded" },
  ]) assert.equal(siteIntegrityObservationSchema.safeParse({ ...observation, ...change }).success, false);
  assert.equal(siteIntegrityProjectionSchema.safeParse({ ...projection, sourceHash: "fake" }).success, false);
});


test("historical v1 scope cannot silently become an additional-page observation", () => {
  assert.equal(siteIntegrityObservationSchema.safeParse({ ...observation, scope: "additional_page_main_document" }).success, false);
  assert.equal(siteIntegrityProjectionSchema.safeParse({ ...projection, observation: { ...observation, contractVersion: "certscore.site-integrity-observation.v2", scope: "additional_page_main_document" } }).success, false);
});
