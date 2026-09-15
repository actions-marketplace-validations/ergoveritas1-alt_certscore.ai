import { consentControlAssessmentSchema } from "@certscore/contracts";

export type ConsentPresentationStates = { accept: string; reject: string; options: string };
/** Presentation of persisted states only; never changes evidence or finding eligibility. */
export function consentInspectionNotice(controls: ConsentPresentationStates, assessment?: unknown): string | null {
  const unavailable = Object.entries(controls).filter(([, state]) => state !== "Observed" && state !== "Not observed")
    .map(([key]) => key === "options" ? "Options" : key === "reject" ? "Reject" : "Accept");
  if (!unavailable.length) return null;
  const parsed = consentControlAssessmentSchema.safeParse(assessment);
  if (parsed.success) {
    const a = parsed.data;
    const reasons = [...a.coverage.reasonCodes, ...a.limitations.map(l => l.code)];
    if (reasons.some(r => /captcha|challenge|access_denied|forbidden/.test(r))) return "Consent inspection was blocked by an access restriction or challenge.";
    if (reasons.some(r => /navigation_transport_failure|navigation_error/.test(r))) return "Consent inspection could not complete because the page failed to load.";
    if (reasons.includes("consent_session_access_limited")) return "Consent inspection was limited by page access.";
    if (a.document.identityStatus === "mismatched") return "Consent inspection could not be completed on one verified page version.";
    if (a.scan.noGo) return "Consent inspection could not complete because this visit did not retain a usable page.";
  }
  return `Initial consent inspection is incomplete for ${unavailable.join(", ")}.`;
}
