# GPC fixed-window evidence and finalization

Implemented following the September 13, 2026 request to improve GPC completion and measure practical impact. This change adds capture and internal replay analysis; it does not deploy a release, change existing response/scoring policy, or integrate new findings into customer surfaces.

## Finalization repair

`startGpcObservationSession.prepareFinalization()` starts the existing terminal `Page.getFrameTree` read alongside page evidence capture. `finish()` performs no browser calls or waiting. A completed readback is usable only if the tracked document generation did not change; navigation requests, document commits, same-document URL changes, crashes, and closure invalidate stale proof. The semantic document must also match.

If the readback is pending or fails, freeze the collected requests in an explicitly incomplete packet. Later callbacks cannot mutate the packet. An error in a later runtime stage preserves already finalized GPC observations in the scanner's error result. Parent cancellation still follows its existing abort path.

New packets retain optional `certscore.gpc-overlapped-finalization.v1` timing/generation metadata. Existing session v1/v2 packets without this metadata remain readable and unchanged. There is still one terminal readback, no retry, and no added observation or tail wait.

The production audit found 19 finalization timeouts among 21 usable-page source failures, including 16 with completed semantic capture. This identifies the repair opportunity, not a measured post-release completion uplift.

## Symmetric impact capture

Both isolated `runtime_evidence` and `gpc_observation` captures retain `gpcImpactCapture` in their existing canonical lane artifacts. Consent-proof, combined legacy runs, and full-site inventory pages do not enable this capture. Window capture reuses the current metadata CDP session, request stream, and navigator readback. The follow-up adds a baseline passive semantic monitor and terminal semantic readback inside the existing budget; it adds no session, model, timer, external request, or longer deadline.

The packet retains:

- the actual document header, loader identity, commit time, readback binding, and capture boundary;
- complete 250, 500, and 1,000 ms post-commit windows when the existing scan lived long enough to observe them;
- exact request count and SHA-256 identity-set digest for each interval;
- explicit dropped-request, document-change, and insufficient-window limitations.

Intervals are half-open `[commit, commit + duration)`. Bootstrap/navigation activity precedes them. The collector caps its temporary request identity list at 5,000 entries. A lost or truncated request invalidates measurement rather than appearing as reduced activity. Same-document URL changes still limit capture. A CDP `historyApi` update may preserve capture only when its full URL (including fragment) matches the committed URL and its current loader token matches the committed document. Missing event identity, changed routes (even if they later return), duplicate commits, and renderer crashes remain invalid. Frozen packets cannot change.

Optional `invalidationReasons` retains up to seven distinct typed reason codes; legacy packets without it remain unchanged. The Lovable post-release example had adequate time and matching final readback but a sticky invalidation flag; its original triggering event was not retained, so historical windows must not be reconstructed or upgraded. A local Chromium fixture verifies the same-URL history-update path, independently of that historical diagnosis.

Current main/frame and worker signal proof remains authoritative; the old GPC response assessment receives no new limits or eligibility shortcuts. The new impact document binding is separate from the old opt-in prototype binding.

## Internal impact assessment

`buildGpcImpactAssessment` verifies original bytes against caller-supplied size/SHA-256 pointers, validates canonical schemas and lane/scan/region/context/document provenance, and checks representative access. It independently replays every retained window digest against the full canonical network events. It selects the largest common supported horizon, never extrapolating a shorter capture.

The result has independent delivery, current CMP-recorded choice, and activity measurements. Activity covers advertising/marketing, analytics/replay, and their tracker union, using canonical vendor/product/purpose identities tied directly to in-window events. It reports removed, new, shared and net identities; classified request and collection-request counts; and lower, higher, unchanged, no observed activity, or new activity outcomes. These are classified request attempts, not proof of server receipt or legal sale/sharing. Baseline-zero results have no percentage reduction.

Current GPC CMP state is derived only from the verified GPC producer session. New baseline runtime artifacts independently retain `gpcImpactSemanticObservation`, without a DOM acknowledgment probe. Paired comparison requires verified source bytes, actual baseline signal-off delivery, scan/document/state-hash provenance, representative access, and matching comparison context and GPP section. It reports sale/sharing opt-out appearance, disappearance, unchanged state, or unknown; it does not establish causation. Legacy baseline artifacts remain `not_captured`, and unverifiable ones remain `unverified`.

The passive monitor can attach to a loaded GPP API that replaced its queued stub, using existing lifecycle/terminal checkpoints and at most two attachment attempts. Stale callbacks from the replaced API are ignored. There is no polling or extension to the observation window. The audited 14 semantic failures contained 12 not-ready states and two malformed states, not hidden valid terminal decisions. Those historical results remain limited.

Global network quiet is not a requirement for this bounded measurement. `mode: internal_only`, `productionProjectable: false`, `scoreEffect: none`, and `causedByGpc: not_established` are enforced literals. The legacy response label and California policy remain unchanged. Historical records lacking the new windows return `insufficient_evidence`; they are never upgraded.

## Replay

Prepare a manifest using the **original worker pointers**, not hashes invented after modifying a bundle:

```json
{
  "scanId": "the-parent-scan-id",
  "baseline": {"path": "runtime/CanonicalEvidenceBundle.json", "sha256": "<original-64-character-sha256>", "sizeBytes": 12345},
  "gpc": {"path": "gpc/CanonicalEvidenceBundle.json", "sha256": "<original-64-character-sha256>", "sizeBytes": 12345}
}
```

Paths resolve relative to the manifest. Replay makes no network calls or writes to production:

```bash
node --import tsx scripts/replay-gpc-impact.ts manifest.json impact.json
```

A bare local `runScan` artifact does not include the worker's lane envelope. Production worker artifacts include it; local integration fixtures use the same `buildLocalV2DagLambdaLaneRun` helper before evaluating provenance.

### Cohort replay

`scripts/replay-gpc-impact-cohort.ts` accepts `{ "scans": [...] }`. Each row has `scanId`, `required`, optional `publishedObservation` (`complete`, `limited`, `unavailable`, `missing`), `revision`, `region`, and optional baseline/GPC pointers in the same local-file format above.

Optional `consent` and `policy` pointers use that same format. The report's `crossLaneAccess` rows and `crossLaneAccessPatterns` summary distinguish all four passive lanes blocked, baseline accessible/GPC blocked, mixed lane access, all accessible, and partial/inconclusive evidence. Every source must independently pass original-byte checksum/size/schema, parent scan, exact lane-envelope, region, and shared target-context checks. A missing lane is not a blocked lane. These patterns suggest investigation routes; they do not establish burst throttling, GPC discrimination, or another cause, and cannot replace missing GPC evidence.

```bash
node --import tsx scripts/replay-gpc-impact-cohort.ts cohort-manifest.json cohort-impact.json
```

The report separates manifest-sourced published completion from verified retained-evidence completion, verified signal delivery, completion among positively verified accessible pages, matched-window coverage, activity changes, and paired CMP changes. Missing/failed required scans remain in the denominator. Baseline-zero activity is not a percentage reduction. Results are grouped by revision, region, and CMP set; different measurement horizons are not pooled. Output is internal-only and score-neutral. Existing output or source files cannot be overwritten.

## Access reliability and independent lane failures

Read-only inspection of the original 108 access/no-go-limited scans produced these diagnostic categories. They explain retained failures, not recovered scans or reclassified canonical evidence:

| Retained access cause | Scans |
|---|---:|
| HTTP access denied | 33 |
| Bot challenge | 29 |
| Navigation/capture deadline | 13 |
| Unresolved access | 10 |
| Empty transport response | 7 |
| Blank/stalled page | 5 |
| HTTP/2 transport failure | 3 |
| Navigation-reset interruption | 3 |
| Client/safety block | 2 |
| Other navigation failure | 2 |
| Download target | 1 |
| **Total** | **108** |

The existing navigation-recovery sequence now awaits the blank-document commit before navigating again, propagates a failed reset, rechecks cancellation, and clamps recovery navigation to remaining time with a capture reserve. It adds no attempt, session, proxy, egress change, or wait budget. This targets reset races; it does not claim to resolve challenges, HTTP/2 failures, or all deadline failures. Access diagnostics also flag contradictory lane labels; a redirect response cannot make a terminal no-go page representative.

Policy homepage navigation now retains optional terminal HTTP status and terminal access separately from first-response timing. A 301 followed by 403 is access-denied, not representative. Successful policy subpages cannot replace the homepage result; failed, unresolved, empty, or unverifiable terminal evidence stays unknown or limited. When constructing a new policy lane envelope from legacy metadata without terminal evidence, access is unknown rather than inferred from its first redirect. Stored historical lane envelopes are not rewritten. Existing canonical no-go and challenge evidence retains precedence.

The September 13 follow-up adds no browser calls, requests, retries, waits, or model usage. Bounded invalidation reasons and terminal fields are estimated below $0.10/month incremental storage at 100,000 scans and 30-day retention (allowing for repeated metadata copies). This estimate was disclosed before implementation. Neither fix changes GPC response/scoring policy or demonstrates recovery from a website's access denial.

The next access-recovery increment makes passive navigation commit and document readiness share one navigation allowance. Time consumed before commit is subtracted from readiness waiting; readiness also leaves 1,000 ms inside the module budget for capture. An exhausted allowance skips readiness waiting (never a zero-timeout unbounded browser call) and retains the current page for ordinary evidence/coverage assessment. This does not declare a blank or blocked page usable, change consent-lane readiness, or add a recovery attempt. Cross-lane analysis runs on supplied local artifacts and adds no production storage or requests; the wait-budget correction adds no recurring cost.

An unrelated policy failure in the cohort was traced to 850-character policy URLs entering a compact summary whose contract permits 500 characters. Compact summaries now omit over-limit identities with explicit limitations, while preserving the full policy observations unchanged. URLs are never truncated into different identities.

When a passive worker fails, already-dispatched passive siblings reach their existing terminal outcomes. Original size/hash-verified successful lane pointers can be retained in the failed terminal event as `certscore.failed-terminal-lane-evidence.v1`. Unverifiable pointers remain explicitly unverifiable. This is diagnostic retention, not a successful scan, substitute canonical evidence, late publication, or report refresh.

The isolated header gap was an aborted redirect with ambiguous redirect-chain metadata, not proven header delivery. It remains limited: no header is borrowed from another request, and `ERR_ABORTED` is not promoted to a verified pre-transmission block.

For the next ordinary production cohort, compare revision/region-matched overall completion, accessible-page completion, access-cause counts, and paired-impact coverage. Investigate the unresolved/transport groups from retained diagnostics before proposing protocol or infrastructure changes. Challenge-solving, paid proxies, retries, longer deadlines, and capacity changes are not part of this implementation.

## Cost and release

Latest readiness assessment: see [September 13 combined benchmark and release gate](gpc-release-benchmark-2026-09-13.md). The local component benchmark is complete and the full preflight passed after fixing the reproduced Reject-control enabled-lookup timeout race. The combined cost sensitivity model reaches approximately $1.51/month; the owner approved the $2/month incremental allowance at 100,000 scans/month and release on September 13. This supersedes treating the earlier separate below-$1 estimates as an aggregate release approval. Actual deployment success and production uplift require separate verification.

The compact activity packet is below 2 KB in the capture fixture, plus about 300 bytes of GPC finalization provenance. No extra S3 objects or browser invocations are added. The initial estimate for compact storage and deterministic processing is below $1/month at 100,000 scans and 30-day retention. Baseline semantic capture and rare failed-lane pointer retention were separately estimated below $1/month each; these are preliminary estimates, not a measured aggregate production bill. Benchmark their combined incremental runtime/storage before deployment and obtain owner approval if the combined expected increase reaches $1/month. No increased capacity or paid service was configured. Read-only retained-artifact diagnostics for this follow-up were estimated below $0.05. A worst-case 5,000-request cap remains computationally bounded. Production latency and completion improvement require fresh ordinary-scan monitoring after release.

Deploy compatible contract consumers before the scanner images through the canonical AWS path. Do not deploy an old strict session reader against packets containing the new optional finalization field. This implementation has not deployed or republished historical reports.

Focused verification includes adversarial contract/measurement fixtures, stalled finalization, navigation/crash invalidation, same-request header readback, old-response neutrality, and a real local baseline/GPC pair with a hanging request and a controlled baseline-only request.

Initial-package verification on September 13: the GPC release suite passed 144 tests, the full contracts suite passed 381 tests, and `pnpm preflight:fast` passed. All 532 stored assessments round-tripped unchanged and retained the same California policy output. Those results predate the follow-up baseline/cohort/access changes and must not be treated as their release gate. Follow-up focused regressions, full contracts tests, and scan-core/Lambda typechecks passed. A follow-up full preflight is recorded separately below.

Follow-up verification on September 13: `pnpm preflight:fast` completed with exit code 0 (`/tmp/certscore-gpc-followup-preflight-recheck.log`). This includes GPC, canonical projection, action evidence, browser/deadline, policy, Lambda, web/worker, and database compatibility checks. An earlier run failed an existing Reject-control rerender fixture; that fixture passed in isolation and in the complete rerun without competing browser test runs. No assertion was relaxed. A local read-only historical compatibility replay also confirmed all 532 stored assessments and California policy outputs remain exactly unchanged after the follow-up. Deployment, aggregate cost/latency benchmarking, and post-release production uplift verification remain outstanding.

That full preflight predates the subsequent cross-lane diagnostic and shared-readiness-budget increment. Its focused verification is recorded separately; rerun the deployment gate on the final release revision before deployment.

Cross-lane/readiness increment verification: 56 focused access, cohort/CLI, paired-browser impact, and legacy-response tests passed (`/tmp/gpc-access-next-focused.log`); five selected deadline/cancellation/substantive-page browser fixtures passed (`/tmp/gpc-access-next-browser.log`). Scan-core typechecking and `git diff --check` passed. This increment introduces no estimated recurring cost increase. Recovery uplift is unmeasured until an authorized release and fresh-cohort review.

A local 50-iteration microbenchmark at the 5,000-request cap produced a 779-byte impact packet, with median capture/serialization time 7.75 ms, p95 11.98 ms, and maximum 23.85 ms. These are local-host measurements, not production Lambda latency or completion-rate claims. The new regressions are included in the GPC release check in `scripts/predeploy.ts`.
