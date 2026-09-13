import assert from "node:assert/strict";
import test from "node:test";
import { assessPolicyHomepageAccess } from "./scanners/policy-surface-scanner";
import { siteFacingNavigationDiagnosticsSchema } from "../../certscore-contracts/src/index";

test("homepage terminal access respects final failures and usable successful content", () => {
  const text = "Our company provides products and services to customers. Contact our support team for assistance. We explain how we collect personal information, use it to provide services and protect it with security safeguards. You may contact us to exercise your privacy rights. ".repeat(8);
  assert.equal(assessPolicyHomepageAccess({ ok: true, status: 200, text }), "representative_page");
  for (const status of [401, 403, 429, 451]) assert.equal(assessPolicyHomepageAccess({ ok: false, status, text }), "access_denied");
  for (const status of [301, 302, 500, undefined]) assert.equal(assessPolicyHomepageAccess({ ok: false, status, text }), "unknown");
  assert.equal(assessPolicyHomepageAccess({ ok: true, status: 200, text: "" }), "unknown");
});

test("terminal navigation contract preserves legacy absence and rejects positive redirect proof", () => {
  const legacy = { requestedUrl: "https://example.com/", firstResponseAt: null, firstResponseOffsetMs: null,
    firstHttpStatus: 301, firstEffectiveUrl: "https://example.com/", navigationCount: 1, challengeDetected: false, challengeType: null };
  assert.deepEqual(siteFacingNavigationDiagnosticsSchema.parse(legacy), legacy);
  for (const terminalHttpStatus of [null, 301, 403]) assert.equal(siteFacingNavigationDiagnosticsSchema.safeParse({ ...legacy, terminalAccess: "representative_page", terminalHttpStatus }).success, false);
  assert.equal(siteFacingNavigationDiagnosticsSchema.safeParse({ ...legacy, terminalAccess: "representative_page", terminalHttpStatus: 200 }).success, true);
});
