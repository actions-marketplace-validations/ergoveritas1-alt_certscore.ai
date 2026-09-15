import assert from "node:assert/strict";
import test from "node:test";
import type { PolicySurfaceObservation } from "@certscore/contracts";
import { normalizePolicySurfaceResultForEarlyHandoff } from "./index.js";

function observation(index: number, status: PolicySurfaceObservation["status"]): PolicySurfaceObservation {
  return {
    artifactRefs: [],
    confidence: status === "fetched" ? 0.99 : 0.8,
    normalizedUrl: "https://example.com/privacy",
    observationId: `privacy-${index}`,
    policyCookieDisclosures: [],
    status,
    surfaceType: "privacy_policy",
    url: `https://example.com/privacy#duplicate-${index}`,
  };
}

test("early policy handoff canonically collapses raw duplicate observations", () => {
  const result = normalizePolicySurfaceResultForEarlyHandoff({
    artifactRefs: [],
    moduleRun: {
      completedAt: "2026-07-31T20:00:03.000Z",
      durationMs: 3_000,
      moduleName: "policySurfaceScanner",
      startedAt: "2026-07-31T20:00:00.000Z",
      status: "completed",
    },
    policySurfaceObservations: [
      ...Array.from({ length: 40 }, (_, index) => observation(index, "observed")),
      observation(40, "fetched"),
    ],
  });

  assert.equal(result.policySurfaceObservations.length, 1);
  assert.equal(result.policySurfaceObservations[0]?.status, "fetched");
  assert.equal(result.policySurfaceObservations[0]?.observationId, "privacy-40");
});

for (const status of ["completed", "partial", "failed", "skipped_budget"] as const) test(`early/terminal policy packet bounds unique observations on ${status} exits`, () => {
  const rows = Array.from({ length: 40 }, (_, i) => ({ ...observation(i, "observed"), normalizedUrl: `https://example.com/privacy/${i}`, url: `https://example.com/privacy/${i}` }));
  const policy = { ...observation(41, "fetched"), documentRole: "policy_document" as const };
  const result = normalizePolicySurfaceResultForEarlyHandoff({
    artifactRefs: [], moduleRun: { moduleName: "policySurfaceScanner", status, durationMs: 1000 },
    policySurfaceObservations: [...rows, policy],
  });
  assert.equal(result.policySurfaceObservations.length, 32);
  assert.ok(result.policySurfaceObservations.some(row => row.observationId === "privacy-41"));
  assert.equal(result.moduleRun.status, status === "completed" ? "partial" : status);
  assert.match(result.moduleRun.errors?.at(-1) ?? "", /omitted 9/);
  assert.deepEqual(normalizePolicySurfaceResultForEarlyHandoff(result), result, "normalization must be stable before hashing/terminal merge");
});

test("policy capture leaves finalization time inside the unchanged output deadline", async () => {
  const { policyCaptureDeadlineBeforeOutput } = await import("./index.js");
  assert.equal(policyCaptureDeadlineBeforeOutput(undefined, 0), undefined);
  assert.equal(policyCaptureDeadlineBeforeOutput(35_000, 0), 33_000);
  assert.equal(policyCaptureDeadlineBeforeOutput(1_000, 0), 800);
  assert.equal(policyCaptureDeadlineBeforeOutput(900, 1_000), 900);
});
