import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { gpcRuntimeFixture } from "../../certscore-contracts/src/test-fixtures/gpc-runtime";
import { comparePassiveLaneAccess, type PassiveAccessLane, type PassiveAccessSources } from "./cross-lane-access";

function source(lane: PassiveAccessLane, blocked = false, regionMismatch = false) {
  const bundle = gpcRuntimeFixture({ enabled: lane === "gpc_observation" });
  bundle.scanLaneRuns[0]!.laneId = lane;
  if (blocked) bundle.scanLaneRuns[0]!.accessOutcome = "access_denied";
  if (regionMismatch) { bundle.region = "eu-west-1"; bundle.scanLaneRuns[0]!.region = "eu-west-1"; }
  const bytes = Buffer.from(JSON.stringify(bundle));
  return { bytes, pointer: { sha256: createHash("sha256").update(bytes).digest("hex"), sizeBytes: bytes.length } };
}
const scanId = gpcRuntimeFixture({ enabled: true }).scanId;
test("cross-lane access separates all-blocked, GPC-specific and mixed outcomes without causal claims", () => {
  const sources: PassiveAccessSources = Object.fromEntries((["consent_proof", "runtime_evidence", "policy_evidence", "gpc_observation"] as const).map(l => [l, source(l, true)]));
  assert.equal(comparePassiveLaneAccess(scanId, sources).pattern, "all_passive_lanes_blocked");
  sources.runtime_evidence = source("runtime_evidence");
  const pair = comparePassiveLaneAccess(scanId, sources);
  assert.equal(pair.pattern, "baseline_accessible_gpc_blocked");
  assert.equal(pair.causeEstablished, false);
  assert.equal(pair.scoreEffect, "none");
  sources.gpc_observation = source("gpc_observation");
  assert.equal(comparePassiveLaneAccess(scanId, sources).pattern, "mixed_lane_access");
  sources.consent_proof = source("consent_proof");
  sources.policy_evidence = source("policy_evidence");
  assert.equal(comparePassiveLaneAccess(scanId, sources).pattern, "all_passive_lanes_accessible");
});
test("a failed worker's representative label is not accessible", () => {
  const original = source("gpc_observation");
  const bundle = JSON.parse(original.bytes.toString());
  bundle.scanLaneRuns[0].executionOutcome = "failed";
  const bytes = Buffer.from(JSON.stringify(bundle));
  const gpc = { bytes, pointer: { sizeBytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") } };
  assert.equal(comparePassiveLaneAccess(scanId, { gpc_observation: gpc }).lanes.find(l => l.lane === "gpc_observation")?.status, "limited");
});
test("missing, corrupt, wrong-lane, wrong-scan and mismatched-region sources do not become blocked or accessible", () => {
  assert.equal(comparePassiveLaneAccess(scanId, {}).pattern, "insufficient_or_mismatched_sources");
  const gpc = source("gpc_observation", true);
  assert.equal(comparePassiveLaneAccess(scanId, { gpc_observation: gpc }).pattern, "partial_or_inconclusive");
  assert.equal(comparePassiveLaneAccess("other", { gpc_observation: gpc }).verifiedLaneCount, 0);
  assert.equal(comparePassiveLaneAccess(scanId, { runtime_evidence: gpc }).verifiedLaneCount, 0);
  assert.equal(comparePassiveLaneAccess(scanId, { gpc_observation: { ...gpc, pointer: { ...gpc.pointer, sha256: "0".repeat(64) } } }).verifiedLaneCount, 0);
  assert.equal(comparePassiveLaneAccess(scanId, { runtime_evidence: source("runtime_evidence"), gpc_observation: source("gpc_observation", true, true) }).pattern, "insufficient_or_mismatched_sources");
});
