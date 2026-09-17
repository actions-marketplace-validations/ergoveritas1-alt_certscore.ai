import { FORM_DESTINATION_FINDING_ID, formDestinationCopy, formDestinationProjectionSchema, unexpectedFormRequests } from "@certscore/contracts";
import type { UnifiedFindingDisplayPacket } from "./unified-findings";

/** Select only policy-eligible, already unified form destination findings. */
export function projectFormDestinationPriority(findings: UnifiedFindingDisplayPacket[]) {
  const finding = findings.find(row => row.unifiedFindingId === FORM_DESTINATION_FINDING_ID &&
    row.presentationDecision.status !== "suppress" && row.details?.family === "form_destinations" &&
    row.concernContext?.promotionEligibilities.includes("eligible") && row.concernContext?.externalSurfacingEligibilities.includes("eligible"));
  if (!finding || finding.details?.family !== "form_destinations") return null;
  const parsed = formDestinationProjectionSchema.safeParse(finding.details.projection);
  if (!parsed.success || !unexpectedFormRequests(parsed.data.trace).length) return null;
  const projection = parsed.data, copy = formDestinationCopy(projection);
  return { id: FORM_DESTINATION_FINDING_ID, title: copy.title, summary: copy.description,
    status: "Partial concern" as const, ...(copy.severity === "high" ? { priority: "high" as const } : {}),
    evidence: unexpectedFormRequests(projection.trace).map(row => `${row.evidenceRef}: ${row.method} ${row.url}; exact personal-field payload match; ${row.eventRef}.`),
    evidenceJson: { formDestinations: projection }, correctionSteps: [copy.action],
  };
}
