import { z } from "zod";
export const FORM_DESTINATION_FINDING_ID = "form_data_unexpected_destination";
export const FORM_DESTINATION_SIGNAL = "forms.unexpected_data_destination";
const ref = z.string().regex(/^form_trace:(?:event|field|request):\d+(?::\d+)?$/);
const safeUrl = z.string().url().max(2048).refine(value => { const u = new URL(value); return /^https?:$/.test(u.protocol) && !u.username && !u.password && !u.search && !u.hash; });
export const formTraceFieldSchema = z.object({ evidenceRef: ref, name: z.string().max(100), category: z.string().max(80), personal: z.boolean(), valueHmac: z.string().regex(/^[a-f0-9]{64}$/).optional() }).strict();
export const formTraceEventSchema = z.object({
  evidenceRef: ref, kind: z.enum(["input", "change", "submit"]), observedAtMs: z.number().nonnegative(), documentUrl: safeUrl,
  documentToken: z.string().min(1), formIndex: z.number().int().nonnegative(), actionUrl: safeUrl, actionDomain: z.string().min(1),
  fields: z.array(formTraceFieldSchema).max(30),
}).strict();
export const formTraceRequestSchema = z.object({
  evidenceRef: ref, networkRequestId: z.string().min(1), eventRef: ref, observedAtMs: z.number().nonnegative(),
  url: safeUrl, domain: z.string().min(1), method: z.string().min(1).max(20),
  party: z.enum(["first_party", "third_party", "unknown"]), outsideDeclaredDestination: z.boolean(),
  status: z.enum(["request_observed", "response_observed", "failed"]),
  relation: z.enum(["temporal_only", "exact_field_value_match"]),
  matches: z.array(z.object({ fieldRef: ref, valueHmac: z.string().regex(/^[a-f0-9]{64}$/), location: z.enum(["query", "body"]) }).strict()).max(30),
}).strict();
export const formDestinationTraceSchema = z.object({
  contractVersion: z.literal("certscore.form-destination-trace.v1"), mode: z.literal("passive"),
  events: z.array(formTraceEventSchema).max(10), requests: z.array(formTraceRequestSchema).max(100),
  coverage: z.object({ truncated: z.boolean(), unsupportedPayloads: z.number().int().nonnegative(), scope: z.literal("main_document_existing_window"), activeSubmission: z.literal(false) }).strict(),
}).strict().superRefine((trace, ctx) => {
  const refs = [...trace.events.map(e => e.evidenceRef), ...trace.events.flatMap(e => e.fields.map(f => f.evidenceRef)), ...trace.requests.map(r => r.evidenceRef)];
  if (new Set(refs).size !== refs.length) ctx.addIssue({ code: "custom", message: "Duplicate form tracing references" });
  for (const request of trace.requests) {
    const event = trace.events.find(e => e.evidenceRef === request.eventRef);
    if (!event || request.observedAtMs < event.observedAtMs || request.matches.some(m => !event.fields.some(f => f.evidenceRef === m.fieldRef && f.personal && f.valueHmac === m.valueHmac)) || (request.relation === "exact_field_value_match") !== (request.matches.length > 0)) ctx.addIssue({ code: "custom", message: "Unbound form request evidence" });
  }
});
export type FormDestinationTrace = z.infer<typeof formDestinationTraceSchema>;
export function unexpectedFormRequests(trace: FormDestinationTrace) {
  return trace.requests.filter(r => r.party === "third_party" && r.outsideDeclaredDestination && r.status === "response_observed" && r.matches.length > 0);
}
export const formDestinationProjectionSchema = z.object({ contractVersion: z.literal("certscore.form-destination-projection.v1"),
  scanId: z.string().min(1), sourceHash: z.string().regex(/^[a-f0-9]{64}$/), verificationStatus: z.literal("verified"),
  trace: formDestinationTraceSchema,
}).strict();
export type FormDestinationProjection = z.infer<typeof formDestinationProjectionSchema>;
export function qualifiesFormDestinationReview(value: unknown) { const p = formDestinationProjectionSchema.safeParse(value); return p.success && unexpectedFormRequests(p.data.trace).length > 0; }
export function formDestinationCopy(projection: FormDestinationProjection) {
  const rows = unexpectedFormRequests(projection.trace);
  const domains = [...new Set(rows.map(r => r.domain))];
  return { title: "Unexpected form-data destination", severity: "high" as const,
    description: `${rows.length} observed ${rows.length === 1 ? "request" : "requests"} contained exact matches to personal-data fields captured during a form interaction and received a response from ${domains.join(", ")}, outside the declared form destination. Review whether these recipients are intended.`,
    action: "Verify the recipient and the form's submission scripts. Remove unintended transmission paths and confirm the intended recipients are disclosed." };
}
export function resolveFormTraceEvidence(projection: FormDestinationProjection, evidenceRef: string) {
  return projection.trace.events.find(e => e.evidenceRef === evidenceRef) ?? projection.trace.events.flatMap(e => e.fields).find(f => f.evidenceRef === evidenceRef) ?? projection.trace.requests.find(r => r.evidenceRef === evidenceRef) ?? null;
}
