import { readVerifiedGpcImpactSource, type GpcImpactSource } from "./gpc-impact-assessment";

const passiveLanes = ["consent_proof", "runtime_evidence", "policy_evidence", "gpc_observation"] as const;
export type PassiveAccessLane = typeof passiveLanes[number];
export type PassiveAccessSources = Partial<Record<PassiveAccessLane, GpcImpactSource>>;

/** Retained-artifact diagnostics only. Never supplies missing lane evidence or
 * changes access/response/score eligibility. Unknown is not blocked. */
export function comparePassiveLaneAccess(scanId: string, sources: PassiveAccessSources) {
  const bundles = passiveLanes.map(lane => {
    const bundle = readVerifiedGpcImpactSource(sources[lane]);
    return bundle?.scanId === scanId && bundle.scanLaneRuns.length === 1 &&
      bundle.scanLaneRuns[0]?.laneId === lane && bundle.scanLaneRuns[0]?.region === bundle.region ? bundle : null;
  });
  const contexts = new Set(bundles.flatMap(b => b ? [JSON.stringify([b.region, b.url])] : []));
  const comparable = contexts.size === 1;
  const lanes = passiveLanes.map((lane, index) => {
    const b = bundles[index], run = b?.scanLaneRuns[0];
    const explicitBlock = run?.accessOutcome === "bot_challenge" || run?.accessOutcome === "access_denied";
    const limited = run?.executionOutcome === "failed" || b?.scanNoGoAssessment?.decision === "no_go" || b?.scanEvidenceLaneAssessment?.outcome === "no_go" ||
      b?.runtimeCoverage?.coverageStatus === "limited_none";
    const status = !b ? "unverified" : !comparable ? "context_mismatch" : explicitBlock ? "blocked" :
      run?.accessOutcome === "representative_page" && !limited ? "accessible" : "limited";
    return { lane, status, accessOutcome: run?.accessOutcome ?? "unknown",
      executionOutcome: run?.executionOutcome ?? "unknown" };
  });
  const baseline = lanes.find(l => l.lane === "runtime_evidence")!, gpc = lanes.find(l => l.lane === "gpc_observation")!;
  const accessible = lanes.filter(l => l.status === "accessible").length;
  const blocked = lanes.filter(l => l.status === "blocked").length;
  const limited = lanes.filter(l => l.status === "limited").length;
  const pattern = !comparable ? "insufficient_or_mismatched_sources" : blocked === 4 ? "all_passive_lanes_blocked" :
    baseline.status === "accessible" && gpc.status === "blocked" ? "baseline_accessible_gpc_blocked" :
    accessible > 0 && blocked + limited > 0 ? "mixed_lane_access" :
    accessible === 4 ? "all_passive_lanes_accessible" : "partial_or_inconclusive";
  return { contractVersion: "certscore.cross-lane-access.v1", mode: "internal_only", productionProjectable: false,
    scoreEffect: "none", causeEstablished: false, verifiedLaneCount: bundles.filter(Boolean).length, pattern, lanes };
}
