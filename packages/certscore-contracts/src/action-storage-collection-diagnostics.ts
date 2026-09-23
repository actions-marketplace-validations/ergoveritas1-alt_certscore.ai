import { z } from "zod";

export const actionStorageChannelDiagnosticSchema = z.object({
  status: z.enum(["empty", "complete", "sampled", "partial", "failed"]),
  retainedCount: z.number().int().nonnegative().max(384),
  droppedCount: z.number().int().nonnegative().max(100_000),
  sampleLimit: z.number().int().positive().max(384),
}).strict().superRefine((value, context) => {
  if (value.retainedCount > value.sampleLimit) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Retained storage count cannot exceed its sample limit." });
  }
  if (value.status === "empty" && (value.retainedCount !== 0 || value.droppedCount !== 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "An empty storage read cannot retain or drop entries." });
  }
  if (value.status === "failed" && value.retainedCount !== 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A failed storage read cannot retain entries." });
  }
  if (value.status === "complete" && value.droppedCount !== 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A complete storage read cannot report dropped entries." });
  }
  if (value.status === "partial" && value.droppedCount === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A partial storage read must report dropped entries." });
  }
  if (value.status === "sampled" && value.droppedCount === 0 && value.retainedCount < value.sampleLimit) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A sampled storage read must indicate sampling." });
  }
});

export const actionStorageCollectionDiagnosticsSchema = z.object({
  policyVersion: z.literal("action_storage_collection_diagnostics.v1"),
  cookies: actionStorageChannelDiagnosticSchema,
  localStorage: actionStorageChannelDiagnosticSchema,
  sessionStorage: actionStorageChannelDiagnosticSchema,
}).strict();

export const actionStoragePhaseDiagnosticsSchema = z.object({
  preAction: actionStorageCollectionDiagnosticsSchema.optional(),
  postAction: actionStorageCollectionDiagnosticsSchema.optional(),
}).strict();

export type ActionStorageCollectionDiagnostics = z.infer<typeof actionStorageCollectionDiagnosticsSchema>;
