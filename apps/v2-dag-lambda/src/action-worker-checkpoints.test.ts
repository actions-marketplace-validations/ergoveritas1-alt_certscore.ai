import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { actionWorkerCheckpoints } from "./action-worker-checkpoints.js";

test("action failure diagnostics preserve ordered, bounded checkpoints across async dispatch", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "action-checkpoints-"));
  try {
    const checkpoint = actionWorkerCheckpoints(directory, "reject");
    await checkpoint("observation_started");
    void checkpoint("action_dispatched");
    await checkpoint("packet_validated");
    await checkpoint("artifact_upload_started");
    const record = JSON.parse(await readFile(path.join(directory, "V2ScanCorePhases.json"), "utf8"));
    assert.deepEqual(record.checkpoints.map((row: { name: string }) => row.name), [
      "reject:observation_started", "reject:action_dispatched", "reject:packet_validated", "reject:artifact_upload_started",
    ]);
    await checkpoint("artifact_upload_completed");
    await checkpoint("artifact_upload_started");
    assert.equal(JSON.parse(await readFile(path.join(directory, "V2ScanCorePhases.json"), "utf8")).checkpoints.length, 5);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
