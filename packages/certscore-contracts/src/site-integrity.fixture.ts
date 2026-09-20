import type { SiteIntegrityObservation, SiteIntegrityProjection } from "./site-integrity";

/** Synthetic retained-contract fixture. No production website evidence. */
export const siteIntegrityObservationFixture: SiteIntegrityObservation = {
  contractVersion: "certscore.site-integrity-observation.v1",
  sourceLane: "runtime_evidence", scope: "starting_page_main_document",
  documentUrl: "https://clinic.example/", documentToken: "document-fixture",
  capturedAt: "2026-09-17T07:22:45.000Z", inspectedLinks: 40, truncated: false,
  links: [
    { evidenceRef: "site_integrity:link:1", destinationDomain: "pharmacy.example", concealment: "zero_size_container" },
    { evidenceRef: "site_integrity:link:2", destinationDomain: "promotion.example", concealment: "offscreen_position" },
    { evidenceRef: "site_integrity:link:3", destinationDomain: "promotion.example", concealment: "zero_font_size" },
  ],
};

export const siteIntegrityProjectionFixture: SiteIntegrityProjection = {
  contractVersion: "certscore.site-integrity-projection.v1", scanId: "fixture", sourceHash: "a".repeat(64),
  observationHash: "b".repeat(64), verificationStatus: "verified",
  evidenceRef: "CanonicalEvidenceBundle.json#siteIntegrityObservation", observation: siteIntegrityObservationFixture,
};
