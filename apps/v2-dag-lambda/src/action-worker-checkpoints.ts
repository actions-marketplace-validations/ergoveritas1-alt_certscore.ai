import { writeFile } from "node:fs/promises";
import path from "node:path";

type ActionCheckpoint = "observation_started" | "action_dispatched" | "packet_validated" | "artifact_upload_started" | "artifact_upload_completed";

/** Bounded diagnostics in the worker's existing failure artifact. No evidence,
 * network upload, retry or publication is created by a checkpoint. */
export function actionWorkerCheckpoints(artifactRoot: string, action: "accept" | "reject") {
  const startedAt = Date.now();
  const checkpoints: Array<{ at: string; elapsedMs: number; name: string; status: string }> = [];
  let pending = Promise.resolve();
  return (phase: ActionCheckpoint) => {
    if (checkpoints.length >= 5) return pending;
    checkpoints.push({ at: new Date().toISOString(), elapsedMs: Date.now() - startedAt,
      name: `${action}:${phase}`, status: phase.endsWith("completed") || phase === "packet_validated" ? "completed" : "started" });
    const body = JSON.stringify({ artifactVersion: "certscore.action_worker_checkpoints.v1", checkpoints });
    pending = pending.then(() => writeFile(path.join(artifactRoot, "V2ScanCorePhases.json"), body, "utf8")).catch(() => undefined);
    return pending;
  };
}
