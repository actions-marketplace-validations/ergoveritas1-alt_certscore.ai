import assert from "node:assert/strict";
import test from "node:test";
import { CertScoreError } from "@certscore/sdk";
import { captureMcpResponse, withResponseCapture } from "./response-capture.js";
import { toInvalidArgumentsToolError, toToolError, toToolResult, withMcpAgentGuidance } from "./tools.js";

test("capture retains controlled validation guidance without raw argument values", () => {
  const response = toInvalidArgumentsToolError("tool certscore_get_scan_bundle", { tool: "certscore_get_scan_bundle", issues: [{ field: "maxBytes", code: "invalid_type" }] });
  const summary = captureMcpResponse(response);
  assert.equal(summary.captureBasis, "response_generated");
  assert.equal(summary.message, "The maxBytes field is invalid.");
  assert.match(summary.recommendedNextAction!, /do not send null/);
  assert.deepEqual(summary.issues, [{ field: "maxBytes", code: "invalid_type" }]);
  assert.equal(summary.textOmitted, false);
});

test("upstream bodies and untrusted response text are never retained", () => {
  const error = Object.assign(new CertScoreError("secret-user@example.com", { status: 404, code: "not_found", responseBody: { error: { message: "secret", recommendedNextAction: "Visit https://private.example/?token=secret" }, evidence: "secret" } }), {
    upstream: { operation: "scan_resource" as const, httpStatus: 404, requestId: "00000000-0000-4000-8000-000000000123" },
  });
  const summary = captureMcpResponse(toToolError(error));
  assert.equal(summary.errorCode, "not_found");
  assert.equal(summary.upstream?.operation, "scan_resource");
  assert.equal(summary.message, undefined);
  assert.equal(summary.recommendedNextAction, undefined);
  assert.equal(summary.textOmitted, true);
  assert.doesNotMatch(JSON.stringify(summary), /secret|private\.example|evidence/);
});

test("capture bounds multibyte text and distinguishes generated protocol errors", () => {
  const protocol = withResponseCapture({ code: -32602, message: "unknown tool", data: { code: "unknown_tool", retryable: false } }, { message: "🙂".repeat(400), recommendedNextAction: "🙂".repeat(800) });
  const summary = captureMcpResponse(undefined, protocol);
  assert.equal(summary.kind, "protocol_error");
  assert.equal(summary.mcpCode, -32602);
  assert.equal(summary.summaryTruncated, true);
  assert.ok(Buffer.byteLength(JSON.stringify(summary)) <= 2048);
});

test("success captures polling metadata without the bundle and terminal fallback retains guidance", () => {
  const success = captureMcpResponse(toToolResult({ type: "certscore_scan_job", status: "queued", retryAfterSeconds: 15, recommendedNextTool: "certscore_get_scan_status", findings: [{ secret: "not retained" }] }));
  assert.equal(success.retryAfterSeconds, 15);
  assert.equal(success.recommendedNextTool, "certscore_get_scan_status");
  assert.ok(Buffer.byteLength(JSON.stringify(success)) < 512);
  const failed = captureMcpResponse(toToolResult(withMcpAgentGuidance({ type: "certscore_scan_job", status: "failed", scanId: "00000000-0000-4000-8000-000000000123" })));
  assert.match(failed.recommendedNextAction!, /uses scan quota/);
});


test("malformed optional metadata cannot suppress the invocation event", () => {
  const summary = captureMcpResponse(withResponseCapture({ isError: true }, { upstream: { operation: "other", httpStatus: 999 } }));
  assert.equal(summary.isError, true);
  assert.equal(summary.summaryTruncated, true);
  assert.equal(summary.upstream, undefined);
});

test("captures nested domain scan identity and the returned typed guidance", async () => {
  const {withResponseGuidance} = await import('./response-guidance.js');
  const {projectMcpToolInvocationObservation} = await import('./server.js');
  const payload = {type: 'certscore_domain_latest_scan', scan: {scanId: '00000000-0000-4000-8000-000000000123', status: 'completed', scanFrom: 'eu_ie'}};
  const result = withResponseGuidance('certscore_get_latest_domain_scan', {}, toToolResult(payload));
  const captured = captureMcpResponse(result);
  assert.equal(captured.scanAssociation, 'linked');
  assert.equal(captured.status, 'completed');
  assert.equal(captured.actionCategory, 'get_bundle');
  assert.equal(captured.recommendedNextTool, 'certscore_get_scan_bundle');
  assert.equal(captured.retryDisposition, 'not_needed');
  assert.equal(captured.creationDecision, 'not_requested');
  assert.equal(captured.quotaConsumed, undefined);
  const observation = projectMcpToolInvocationObservation({args:{domain:'example.com'}, result, durationMs:206, toolName:'certscore_get_latest_domain_scan'});
  assert.equal(observation.scanId,payload.scan.scanId);
  assert.equal(observation.scanStatus,'completed');
  assert.equal(observation.scanFrom,'eu_ie');
  const empty = withResponseGuidance('certscore_get_latest_domain_scan', {}, toToolResult({type:'certscore_domain_latest_scan',scan:null}));
  assert.equal(captureMcpResponse(empty).scanAssociation,'no_eligible_scan');
  assert.equal(captureMcpResponse(empty).actionCategory,'create_if_requested');
});

test("typed capture retains paging and explicit consumption, never raw guidance prose", async () => {
  const {withResponseGuidance} = await import('./response-guidance.js');
  const page = captureMcpResponse(withResponseGuidance('certscore_list_findings', {}, toToolResult({scanId:'s',pagination:{offset:0,returned:2,limit:2,truncated:true}})));
  assert.equal(page.actionCategory,'get_next_page');
  assert.deepEqual(page.pagination,{nextOffset:2,complete:false});
  const queued = captureMcpResponse(withResponseGuidance('certscore_scan_site', {}, toToolResult({scanId:'s',status:'queued',retryAfterSeconds:5,quotaConsumed:true})));
  assert.equal(queued.retryAfterSeconds,5);
  assert.equal(queued.quotaConsumed,true);
  assert.equal(queued.actionCategory,'poll_status');
  assert.equal(queued.retryDisposition,'follow_guidance');
  const diagnostic = captureMcpResponse(withResponseGuidance('certscore_get_connection_status', {}, toToolResult({type:'certscore_auth_check',diagnostics:{nextAction:'secret@example.com'}})));
  assert.equal(diagnostic.scanAssociation,'not_applicable');
  assert.equal(diagnostic.actionCategory,'review_connection');
  assert.doesNotMatch(JSON.stringify(diagnostic),/secret@example/);
});

test('Light captures bounded preview, completeness and separate anonymous allowance', () => {
  const result=withResponseCapture(toToolResult({status:'running', anonymousQuotaLimit:20, anonymousQuotaRemaining:19, anonymousQuotaResetAt:'2026-09-12T12:00:00Z', findingsMetadata:{returned:1,total:12},preConsentCookiesTrackers:{returned:2,total:8},mcpMetadata:{omittedSections:['additionalFindings','secret@invalid']}}), {firstResult:'preview',previewWaitMs:900,internalReadCount:2});
  const capture=captureMcpResponse(result);
  assert.equal(capture.firstResult,'preview');
  assert.equal(capture.previewWaitMs,900);
  assert.equal(capture.internalReadCount,2);
  assert.deepEqual(capture.anonymousCreationQuota,{limit:20,remaining:19,resetAt:'2026-09-12T12:00:00Z'});
  assert.deepEqual(capture.completeness,{findingsReturned:1,findingsTotal:12,inventoryReturned:2,inventoryTotal:8,omittedSections:['additionalFindings']});
  assert.ok(Buffer.byteLength(JSON.stringify(capture))<=2048);
});
