export const observedControlAssessment = {
    artifactType: "consent_control_assessment",
    artifactVersion: "2.1",
    evidencePolicy: "structured_control_evidence.v1",
    visualEvidence: { status: "unavailable", artifactRefs: [], reasonCodes: [] },
    assessmentStatus: "complete",
    scan: { scanId: "scan-1", requestedUrl: null, finalUrl: null, scanStatus: "completed", noGo: false },
    document: { identityStatus: "matched", canonicalDocumentId: "doc-1", observedDocumentIds: ["doc-1"], canonicalDocumentToken: null, observedDocumentTokens: [], reasonCodes: [] },
    surface: { status: "observed_actionable", firstObservedAtMs: 10, lastObservedAtMs: 10, evidenceRefs: [] },
    controls: {
      accept: { state: "observed", layer: "first_layer", reasonCodes: [], evidenceRefs: [], firstObservedAtMs: 10, lastObservedAtMs: 10 },
      reject: { state: "observed", layer: "first_layer", reasonCodes: [], evidenceRefs: [], firstObservedAtMs: null, lastObservedAtMs: null },
      options: { state: "observed", layer: "first_layer", reasonCodes: [], evidenceRefs: [], firstObservedAtMs: null, lastObservedAtMs: null },
      privacyOptOut: { state: "observed", layer: "first_layer", reasonCodes: [], evidenceRefs: [], firstObservedAtMs: null, lastObservedAtMs: null },
    },
    coverage: { status: "complete", requiredChannels: ["dom_inventory"], completedChannels: ["dom_inventory"], incompleteChannels: [], reasonCodes: [] },
    evidence: [], contradictions: [], limitations: [],
    provenance: { projectorId: "wc01.consent-control-assessment", projectorVersion: "test", contractVersion: "2.1", sourceBundleVersion: null, sourceGeometryVersion: null, sourceHash: "fnv1a-1234abcd", computedAt: "2026-09-11T00:00:00.000Z" },
  };
