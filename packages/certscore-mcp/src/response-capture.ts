import { mcpResponseSummarySchema, type McpResponseSummary } from "@website-signal-risk-scanner/shared/dist/mcp-response-summary.js";

type SafeMetadata = { firstResult?: McpResponseSummary["firstResult"]; previewWaitMs?: number; internalReadCount?: number; message?: string; recommendedNextAction?: string; upstream?: McpResponseSummary["upstream"] };
const controlled = new WeakMap<object, SafeMetadata>();
/** Only call with template-owned text. Never mark upstream messages or caller values. */
export function withResponseCapture<T extends object>(result: T, metadata: SafeMetadata): T {
  controlled.set(result, { ...controlled.get(result), ...metadata });
  return result;
}
export function transferResponseCapture<T extends object>(payload: unknown, result: T): T {
  const metadata = payload && typeof payload === "object" ? controlled.get(payload) : undefined;
  return metadata ? withResponseCapture(result, metadata) : result;
}
const record = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
const token = (value: unknown) => typeof value === "string" && /^[a-zA-Z0-9_.:-]{1,80}$/.test(value) ? value : undefined;
export function captureMcpResponse(result: unknown, protocolError?: unknown): McpResponseSummary {
  const outer = record(result);
  let payload = record(outer.structuredContent);
  if (!Object.keys(payload).length && Array.isArray(outer.content)) {
    const text = outer.content.find((item: any) => item?.type === "text")?.text;
    if (typeof text === "string") { try { payload = record(JSON.parse(text)); } catch { /* Markdown is never retained. */ } }
  }
  const scan = payload.type === "certscore_domain_latest_scan" ? record(payload.scan) : payload;
  const guidance = record(record(outer._meta)['ai.certscore/responseGuidance']);
  const next = record(guidance.nextAction);
  const actionCategories = ["poll_status", "get_bundle", "get_next_page", "create_if_requested", "summarize", "review_connection", "stop_review"] as const;
  const actionCategory = actionCategories.find(value => value === guidance.actionCategory);
  const page = record(guidance.pagination);
  const fm = record(payload.findingsMetadata), inventory = record(payload.preConsentCookiesTrackers), metadata = record(payload.mcpMetadata);
  const counts: Record<string, number | string[]> = {};
  for (const [key, value] of Object.entries({ findingsReturned: fm.returned, findingsTotal: fm.total, inventoryReturned: inventory.returned, inventoryTotal: inventory.total })) {
    if (Number.isInteger(value) && value >= 0) counts[key] = value;
  }
  if (Array.isArray(metadata.omittedSections)) counts.omittedSections = metadata.omittedSections.filter((v: unknown) => token(v)).slice(0, 12);
  const quota = {limit: payload.anonymousQuotaLimit, remaining: payload.anonymousQuotaRemaining, resetAt: payload.anonymousQuotaResetAt};
  const protocol = record(protocolError);
  const error = protocolError ? record(protocol.data) : record(payload.error);
  const safe = controlled.get(protocolError ? protocol : outer) ?? {};
  const retryAfterSeconds = Object.hasOwn(error, "retryAfterSeconds") ? error.retryAfterSeconds : payload.retryAfterSeconds ?? next.retryAfterSeconds;
  const summary: McpResponseSummary = {
    version: 1, captureBasis: "response_generated", templateVersion: "2026-09-11.1",
    kind: protocolError ? "protocol_error" : "tool_result", isError: protocolError ? true : outer.isError === true,
    type: token(payload.type), status: token(scan.status ?? scan.scanStatus), errorCode: token(error.code), reasonCode: token(error.reasonCode),
    ...(Number.isInteger(protocolError ? protocol.code : error.mcpCode) ? { mcpCode: protocolError ? protocol.code : error.mcpCode } : {}),
    ...(typeof error.retryable === "boolean" ? { retryable: error.retryable } : {}),
    ...(retryAfterSeconds === null || Number.isInteger(retryAfterSeconds) && retryAfterSeconds >= 0 && retryAfterSeconds <= 86400 ? { retryAfterSeconds } : {}),
    recommendedNextTool: token(next.tool) ?? (payload.recommendedNextTool === null ? null : token(payload.recommendedNextTool)),
    ...(actionCategory ? { actionCategory } : {}),
    retryDisposition: !protocolError && outer.isError !== true && ["summarize", "get_bundle", "get_next_page", "create_if_requested", "review_connection"].includes(actionCategory ?? "") ? "not_needed" : actionCategory ? "follow_guidance" : "not_recorded",
    scanAssociation: token(scan.scanId ?? scan.scan_id) ? "linked" : payload.type === "certscore_domain_latest_scan" && payload.scan === null ? "no_eligible_scan" : payload.type === "certscore_auth_check" ? "not_applicable" : "not_recorded",
    ...(typeof (error.quotaConsumed ?? payload.quotaConsumed) === "boolean" ? { quotaConsumed: error.quotaConsumed ?? payload.quotaConsumed } : {}),
    ...(typeof (error.scanStarted ?? payload.scanStarted) === "boolean" ? { scanStarted: error.scanStarted ?? payload.scanStarted } : {}),
    ...(token(metadata.truncationReason) ? { omissionReason: token(metadata.truncationReason) } : {}),
    ...(["new_scan", "reused_scan", "not_requested", "unknown"].includes(guidance.creationDecision) ? { creationDecision: guidance.creationDecision } : {}),
    ...(typeof page.complete === "boolean" && (page.nextOffset === null || Number.isInteger(page.nextOffset) && page.nextOffset >= 0) ? { pagination: { complete: page.complete, nextOffset: page.nextOffset } } : {}),
    ...(Number.isInteger(quota.limit) && quota.limit >= 0 && Number.isInteger(quota.remaining) && quota.remaining >= 0 && typeof quota.resetAt === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(quota.resetAt) ? { anonymousCreationQuota: quota } : {}),
    ...(Object.keys(counts).length ? { completeness: counts } : {}),
    ...safe,
    textOmitted: Boolean((protocolError ? protocol.message : error.message) && !safe.message || (error.recommendedNextAction || payload.recommendedNextAction) && !safe.recommendedNextAction),
    summaryTruncated: false,
  };
  // Issues are captured only from our controlled validation response.
  if (safe.message && Array.isArray(error.issues)) summary.issues = error.issues.slice(0, 8).map((issue: any) => ({ field: token(issue.field) ?? "arguments", code: token(issue.code) ?? "invalid", ...(issue.required === true ? { required: true } : {}) }));
  for (const [key, limit] of [["message", 400], ["recommendedNextAction", 800]] as const) {
    if ((summary[key]?.length ?? 0) > limit) { summary[key] = summary[key]!.slice(0, limit); summary.summaryTruncated = true; }
  }
  // Bound UTF-8 bytes as well as character counts; preserve diagnosis before prose.
  for (const key of ["recommendedNextAction", "message", "issues"] as const) {
    if (Buffer.byteLength(JSON.stringify(summary)) <= 2048) break;
    delete summary[key]; summary.summaryTruncated = true; summary.textOmitted = true;
  }
  const parsed = mcpResponseSummarySchema.safeParse(summary);
  return parsed.success ? parsed.data : {
    version: 1, captureBasis: "response_generated", templateVersion: "2026-09-11.1",
    kind: summary.kind, isError: summary.isError, textOmitted: true, summaryTruncated: true,
  };
}
