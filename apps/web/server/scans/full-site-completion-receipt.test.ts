import assert from "node:assert/strict";
import test from "node:test";
import { matchesFullSiteCompletionReceipt } from "./full-site-completion-receipt";
test("lost finish acknowledgement requires the exact persisted verified receipt", () => {
  const request = { sha256: "a".repeat(64), sizeBytes: 100, evidenceSizeBytes: 200 };
  assert.equal(matchesFullSiteCompletionReceipt({ ...request, sourceHash: "b".repeat(64) }, request), true);
  for (const receipt of [null, {}, {...request, sha256: "b".repeat(64)}, {...request, sizeBytes: 101}, {...request, evidenceSizeBytes: 201}, {sha256: request.sha256,sizeBytes:100}]) {
    assert.equal(matchesFullSiteCompletionReceipt(receipt, request), false);
  }
  assert.equal(matchesFullSiteCompletionReceipt({}, {}), false);
});
