import { z } from "zod";
export const terminalLaneEvidenceSchema = z.object({
  contractVersion: z.literal("certscore.failed-terminal-lane-evidence.v1"),
  scanId: z.string().min(1).max(160),
  mode: z.literal("internal_only"), scoreEffect: z.literal("none"), productionProjectable: z.literal(false),
  lanes: z.array(z.object({
    lane: z.enum(["consent_proof", "runtime_evidence", "policy_evidence", "gpc_observation"]),
    status: z.enum(["verified_retained", "unverifiable", "failed"]),
    source: z.object({ uri: z.string().startsWith("s3://").max(1000), sha256: z.string().regex(/^[a-f0-9]{64}$/), sizeBytes: z.number().int().positive().max(20_000_000) }).strict().nullable(),
  }).strict()).max(4),
}).strict().superRefine((v, ctx) => {
  if (new Set(v.lanes.map(l => l.lane)).size !== v.lanes.length || v.lanes.some(l => l.status === "verified_retained" && !l.source))
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Verified lane outcomes require unique, retained sources." });
});
export type TerminalLaneEvidence = z.infer<typeof terminalLaneEvidenceSchema>;
