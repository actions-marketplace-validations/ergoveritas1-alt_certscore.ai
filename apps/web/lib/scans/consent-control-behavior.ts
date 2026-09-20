import type { ConsentControlAssessment } from "@certscore/contracts";

/** Annotation of retained typed semantics; does not change A/R/O or registration. */
export function projectConsentControlBehavior(assessment: ConsentControlAssessment) {
  if (assessment.controls.accept.state !== "observed" || assessment.document.identityStatus !== "matched") return null;
  const controls = assessment.evidence.filter(row => row.intent === "accept" && row.layer === "first_layer" &&
    row.visible === true && row.actionable === true && row.classifier?.reasonCodes.includes("variant_approval_acknowledgment"));
  if (!controls.length) return null;
  return {
    version: "contextual-acknowledgment-description.v1",
    sourceHash: assessment.provenance.sourceHash,
    evidenceRefs: controls.map(row => row.evidenceId),
    labels: controls.map(row => row.label).filter((label): label is string => Boolean(label)),
    description: "The observed control is a contextual acknowledgment. Its visibility counts as an observed control type; it does not prove that consent was registered. Continued use or an information link does not verify a consent decision.",
  };
}
