import assert from "node:assert/strict";
import test from "node:test";
import { captureMcpCallerInput, mergeMcpCallerInputs, mcpCallerInputSchema } from "./mcp-caller-input";
import { boundMcpRequestDetails, mcpRequestDetailsSchema } from "./mcp-telemetry";

const sharedQuestion = { questionSummary: "Check tracking before consent", questionSource: "user_wording", shareForImprovement: true };

test("expanded capture retains long prompt text and nested metadata without legacy preview truncation", () => {
  const prompt = "Review the site's privacy disclosures carefully.\n".repeat(50);
  const result = captureMcpCallerInput({ options: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`flag${i}`, true])), prompt }, { nested: { one: { two: { note: "Supplied context" } } } }, { expanded: true });
  assert.equal(result.version, 2);
  assert.equal(result.fields[0]?.value, prompt);
  assert.ok(result.fields.length > 24);
  assert.equal(result.fields.find(f => f.path === "request_meta.nested.one.two.note")?.value, "Supplied context");
  assert.equal(mcpCallerInputSchema.safeParse(result).success, true);
  assert.equal(mcpCallerInputSchema.safeParse({ ...result, version: 1 }).success, false);
  const legacy = captureMcpCallerInput({ prompt });
  assert.equal(legacy.version, 1);
  assert.equal(String(legacy.fields[0]?.value).length, 300);
  assert.equal(legacy.fields[0]?.disposition, "truncated");
  assert.ok(!String(legacy.fields[0]?.value).includes("\n"));
});

test("expanded capture checks the full text for secrets and explicitly omits oversized values", () => {
  const prefix = "Please review this site's policies. ".repeat(100);
  const result = captureMcpCallerInput({ prompt: prefix + " password private-value", notes: "safe words ".repeat(1000), taskContext: { ...sharedQuestion, shareForImprovement: false } }, undefined, { expanded: true });
  assert.equal(result.fields.find(f => f.path === "arguments.prompt")?.value, "[redacted]");
  assert.equal(result.fields.find(f => f.path === "arguments.notes")?.reason, "text_limit");
  assert.equal(result.questionStatus, "sharing_not_confirmed");
  assert.ok(!JSON.stringify(result).includes("private-value"));
  assert.ok(!JSON.stringify(result).includes(sharedQuestion.questionSummary));
  assert.equal(mcpCallerInputSchema.safeParse(result).success, true);
});

test("expanded envelope preserves shared text, handles multibyte limits, and never mutates input", () => {
  const question = "Explain the policy disclosures. ".repeat(120);
  const input = { version: 2 as const, arguments: {}, argumentsOmitted: false, actorBasis: "unavailable" as const, sessionBasis: "unavailable" as const, rateLimit: null,
    taskContext: { ...sharedQuestion, questionSource: "user_wording" as const, questionSummary: question },
    callerInput: captureMcpCallerInput({ prompt: "日本語の説明。".repeat(800) }, undefined, { expanded: true }) };
  const original = JSON.stringify(input);
  const result = boundMcpRequestDetails(input);
  assert.equal(result.taskContext?.questionSummary, question);
  assert.ok(Buffer.byteLength(JSON.stringify(result, null, 1)) <= 16384);
  assert.equal(mcpRequestDetailsSchema.safeParse(result).success, true);
  assert.equal(JSON.stringify(input), original);
  const oversized = boundMcpRequestDetails({ ...input, taskContext: { ...input.taskContext, questionSummary: "日。".repeat(4000) } });
  assert.equal(oversized.taskContext?.questionSummary, undefined);
  assert.equal(oversized.callerInput?.questionStatus, "omitted_by_limit");
  assert.equal(mcpRequestDetailsSchema.safeParse(oversized).success, true);
});

test("retains supplied extra text and metadata without asserting it is a chat transcript", () => {
  const result = captureMcpCallerInput({ reason: "Vendor renewal review", notes: "Focus on analytics", prompt: "Check consent controls", options: { enabled: true } }, {
    "io.modelcontextprotocol/clientInfo": { name: "Example client", version: "1.2.3" }, progressToken: "do-not-store",
  });
  assert.equal(result.fields.find(f => f.path === "arguments.reason")?.value, "Vendor renewal review");
  assert.equal(result.fields.find(f => f.path === "request_meta.clientInfo.version")?.value, "1.2.3");
  assert.equal(result.fields.find(f => f.path === "request_meta.progressToken")?.reason, "sensitive_field");
  assert.equal(JSON.stringify(result).includes("do-not-store"), false);
  assert.equal(mcpCallerInputSchema.safeParse(result).success, true);
});

test("redacts secrets and contact values, withholds chat history, and retains only URL origins", () => {
  const result = captureMcpCallerInput({ url: "https://example.com/private/path?customer=abc#detail", apiKey: "abc123", messages: ["private chat"],
    notes: "Contact person@example.com or +1 (415) 555-1234", nested: { password: "private-value" }, token: "another-private-value" });
  const serialized = JSON.stringify(result);
  for (const value of ["/private/path", "customer=abc", "private chat", "abc123", "person@example.com", "555-1234", "private-value"]) assert.ok(!serialized.includes(value), value);
  assert.equal(result.fields.find(f => f.path === "arguments.url")?.value, "https://example.com");
  assert.equal(result.fields.find(f => f.path === "arguments.url")?.reason, "url_components_removed");
  assert.equal(mcpCallerInputSchema.safeParse(result).success, true);
  assert.equal(mcpCallerInputSchema.safeParse({ ...result, fields: [{ path: "arguments.password", type: "string", value: "raw", disposition: "retained" }] }).success, false);
  assert.equal(mcpCallerInputSchema.safeParse({ ...result, fields: [{ path: "arguments.notes", type: "string", value: "email person@example.com", disposition: "retained" }] }).success, false);
});

test("distinguishes absent, unapproved, malformed, filtered and retained question context without a capture bypass", () => {
  for (const [args, status] of [
    [{}, "not_provided"], [{ taskContext: { ...sharedQuestion, shareForImprovement: false } }, "sharing_not_confirmed"],
    [{ taskContext: { ...sharedQuestion, unexpected: true } }, "invalid_context"],
    [{ taskContext: { ...sharedQuestion, questionSummary: "Check https://example.com" } }, "filtered"],
    [{ taskContext: sharedQuestion }, "retained"],
  ] as const) {
    const result = captureMcpCallerInput(args);
    assert.equal(result.questionStatus, status);
    assert.ok(result.fields.every(field => !field.path.startsWith("arguments.taskContext.")));
    assert.ok(!JSON.stringify(result).includes("Check tracking before consent"));
  }
});

test("bounded recursive capture and merging fit the existing PostgreSQL envelope even for multibyte text", () => {
  const large = captureMcpCallerInput(Object.fromEntries(Array.from({length:1000},(_,i)=>[`field${i}`, "日本語の説明。".repeat(40)])));
  assert.ok(large.limits.length);
  assert.ok(large.fields.length <= 24);
  const result = boundMcpRequestDetails({ version: 1, arguments: { url: "https://example.com" }, argumentsOmitted: false, actorBasis: "requester_binding", sessionBasis: "mcp_session", rateLimit: null,
    callerInput: mergeMcpCallerInputs(large, captureMcpCallerInput({}, { client: { name: "Example" } })), taskContext: { ...sharedQuestion, questionSource: "user_wording" } });
  assert.ok(Buffer.byteLength(JSON.stringify(result, null, 1)) <= 4096);
  assert.equal(result.taskContext?.questionSummary, sharedQuestion.questionSummary);
  assert.equal(mcpRequestDetailsSchema.safeParse(result).success, true);
  const deep = captureMcpCallerInput({ nested: { one: { two: { three: "hidden" } } }, ["x".repeat(1000)]: "hidden" });
  assert.equal(JSON.stringify(deep).includes("hidden"), false);
  assert.ok(deep.fields.some(f=>f.reason === "depth_limit"));
  assert.ok(deep.fields.some(f=>f.reason === "invalid_field_name"));
});
