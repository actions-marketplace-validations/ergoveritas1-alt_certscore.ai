import { postAcceptReportProjectionSchema, postRefusalReportProjectionSchema } from "@certscore/contracts";

export function completedActionProjection(action: "accept" | "reject") {
  const schema = action === "accept" ? postAcceptReportProjectionSchema : postRefusalReportProjectionSchema;
  return schema.parse({
    contractVersion: action === "accept" ? "certscore.post_accept_report_projection.v1" : "certscore.post_refusal_report_projection.v1",
    completedAt: "2026-09-22T00:00:02.000Z", status: "unconfirmed", registrationStatus: "unconfirmed",
    productionProjectable: false, evidenceDisposition: "indeterminate", indeterminateReason: "unconfirmed",
    contradictionObserved: false, observationCount: 0, observationWindowMs: 1000, limitations: [],
    packetSha256: "a".repeat(64), resolverMethod: "cmp_registry_recipe",
    ...(action === "accept" ? { acceptanceExercised: false, postAcceptActivity: [] }
      : { refusalExercised: false, postRefusalActivity: [], preConsentStorageNotCleared: [] }),
    actionControlProof: { contractVersion: "certscore.consent_action_control_proof.v2", action,
      observedAtMs: 50, accessibleLabel: action === "accept" ? "Accept all" : "Reject all",
      labelSource: "visible_text", actionSemantics: "direct_label", classifierIntent: action,
      classifierConfidence: 1, recipeId: "fixture", selectorHint: "#choice", visible: true, enabled: true, uniquelyActionable: true },
    afterActionCapture: { policyVersion: "bounded_after_action_capture.v2", action, activationStatus: "completed",
      actionDispatchedAtMs: 100, captureEndedAtMs: 1100, requestedWindowMs: 1000, stopReason: "window_elapsed",
      requestsDropped: 0, storageSnapshotRetained: true, storageWriteCoverage: "bounded_main_document_sample",
      storageWrites: [], requestIds: [], requestAncestry: [] }, afterActionRequests: [], afterActionStorage: [],
  });
}
