import assert from "node:assert/strict";
import test from "node:test";
import { buildRegulatoryChecklistEvidenceHighlights } from "./regulatory-checklist-evidence-highlights";

test("pre-consent storage highlights include fallback request timing when cookie write timing is absent", () => {
  const highlights = buildRegulatoryChecklistEvidenceHighlights({
    evidenceDetails: {
      cookieEvidence: {
        cookieWriteEvidence: [
          {
            category: "analytics",
            cookieName: "_ga",
            domain: ".caltech.edu",
            preConsent: true,
            vendor: "Google Analytics"
          }
        ]
      },
      timing: {
        firstNonEssentialRequestMs: 1164
      }
    } as never,
    id: "analytics_cookie_pre_consent",
    label: "Analytics cookies before consent"
  });

  assert.equal(
    highlights[0],
    "Storage observed before consent: Google Analytics on .caltech.edu. First non-essential request at ~1.16s."
  );
  assert.equal(
    highlights[1],
    "\"Google Analytics\", \"preConsent\": true, \"category\": \"analytics\", \"domain\": \".caltech.edu\""
  );
});


test("tracking highlights bind time and product to the qualifying request, never fonts or aggregate timing", () => {
 const base = { firstSeenMs: 5010, runtimePhase: "pre_consent", essentiality: "non_essential", category: "advertising", collectionEndpointObserved: true, confidence: .99, name: "Meta Pixel" };
 const font = { ...base, requestUrl: "https://fonts.googleapis.com/css2" };
 const pixel = { ...base, firstSeenMs: 7070, requestUrl: "https://www.facebook.com/tr/" };
 for (const rows of [[font, pixel], [font]]) {
  const result = buildRegulatoryChecklistEvidenceHighlights({ id:"preconsent_tracking", label:"Pre-consent tracking",
    evidenceDetails: { representativeRequests: rows, timingAnalysis: { firstThirdPartyRequestMs: 5010 } } as never });
  if (rows.length === 2) assert.match(result.join(" "), /Meta Pixel at 7.07s/);
  else assert.deepEqual(result, []);
  assert.doesNotMatch(result.join(" "), /5.01|Google Fonts/);
 }
});
