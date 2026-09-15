import { z } from "zod";
import { consentDecisionEvidenceSchema } from "./consent-action-evidence-policy";
import type { AfterActionCapture } from "./after-action-capture";

/** Late decision proof is operational evidence. It never backdates the initial
 * registration protocol or makes after-click facts post-registration facts. */
export const terminalConsentDecisionSchema = z.object({
  policyVersion: z.literal("bounded_terminal_consent_decision.v1"),
  action: z.enum(["accept", "reject"]),
  authorizedTargetSha256: z.string().regex(/^[a-f0-9]{64}$/),
  readStartedAtMs: z.number().int().nonnegative(),
  readCompletedAtMs: z.number().int().nonnegative(),
  evidence: consentDecisionEvidenceSchema,
}).strict().superRefine((value, context) => {
  if (value.evidence.basis !== "verified_state" ||
    value.evidence.decision !== (value.action === "accept" ? "granted" : "denied") ||
    value.readCompletedAtMs < value.readStartedAtMs ||
    value.evidence.observedAtMs === undefined || value.evidence.observedAtMs > value.readCompletedAtMs) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Terminal proof requires a matching verified decision and retained read timing." });
  }
});
export type TerminalConsentDecision = z.infer<typeof terminalConsentDecisionSchema>;

export function terminalConsentDecisionBound(value: TerminalConsentDecision, capture: AfterActionCapture | undefined,
  proof: { action: string; authorizedTargetSha256?: string } | undefined, action: "accept" | "reject") {
  return capture?.action === action && capture.activationStatus === "completed" && capture.stopReason === "window_elapsed" &&
    capture.requestsDropped === 0 && capture.storageSnapshotRetained && value.action === action &&
    proof?.action === action && proof.authorizedTargetSha256 === value.authorizedTargetSha256 &&
    value.readStartedAtMs >= capture.actionDispatchedAtMs &&
    value.readCompletedAtMs <= capture.actionDispatchedAtMs + capture.requestedWindowMs &&
    value.readCompletedAtMs <= capture.captureEndedAtMs &&
    value.evidence.observedAtMs! >= capture.actionDispatchedAtMs;
}

export function validateTerminalConsentDecision(value: TerminalConsentDecision | undefined, capture: AfterActionCapture | undefined,
  proof: { action: string; authorizedTargetSha256?: string } | undefined, action: "accept" | "reject", context: z.RefinementCtx) {
  if (value && !terminalConsentDecisionBound(value, capture, proof, action)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["terminalDecisionEvidence"], message: "Terminal decision must bind to the completed authorized after-action capture." });
  }
}
