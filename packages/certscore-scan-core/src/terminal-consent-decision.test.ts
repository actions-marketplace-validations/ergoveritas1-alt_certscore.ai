import assert from "node:assert/strict";
import test from "node:test";
import type { AfterActionCapture } from "@certscore/contracts";
import { terminalConsentDecisionRead } from "./terminal-consent-decision.js";

test("terminal reads retain only in-window, same-document, uncancelled results and run once", async context => {
  let now = 1800;
  context.mock.method(Date, "now", () => now);
  for (const failure of ["none", "late", "cancelled", "target_changed", "stale"] as const) {
    now = 1800;
    let authorized = true;
    let reads = 0;
    const controller = new AbortController();
    let complete!: (value: { stateHash: string; observedAtEpochMs: number }) => void;
    const pending = new Promise<{ stateHash: string; observedAtEpochMs: number }>(resolve => { complete = resolve; });
    const read = terminalConsentDecisionRead({ action: "reject", authorizedTargetSha256: "a".repeat(64),
      parentScanStartedAtMs: 0, dispatchedAtEpochMs: 1000, observationWindowMs: 1000,
      signal: controller.signal, targetStillAuthorized: () => authorized,
      read: () => { reads++; return pending; } });
    read.start(); read.start();
    assert.equal(reads, 1);
    now = failure === "late" ? 2001 : 1900;
    if (failure === "cancelled") controller.abort();
    if (failure === "target_changed") authorized = false;
    complete({ stateHash: "b".repeat(64), observedAtEpochMs: failure === "stale" ? 999 : 1850 });
    await Promise.resolve();
    now = 2000;
    const capture: AfterActionCapture = { policyVersion: "bounded_after_action_capture.v1", action: "reject",
      activationStatus: "completed", actionDispatchedAtMs: 1000, captureEndedAtMs: 2000, requestedWindowMs: 1000,
      stopReason: "window_elapsed", requestsDropped: 0, storageSnapshotRetained: true,
      storageWriteCoverage: "bounded_main_document_sample", storageWrites: [], requestIds: [] };
    assert.equal(Boolean(read.retained(capture)), failure === "none", failure);
    if (failure === "none") {
      authorized = false;
      assert.equal(read.retained(capture), undefined, "recheck target when retaining proof");
    }
  }
});
