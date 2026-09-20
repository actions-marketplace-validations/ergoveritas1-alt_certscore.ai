# GPC release readiness — September 13, 2026

Latest status: **full `pnpm preflight:fast` passed after the reproduced Reject rerender race was fixed**. On September 13 the owner approved release and the $2/month incremental allowance at 100,000 scans/month. Deployment preparation is authorized; successful production promotion must still be verified separately. The earlier failed gate below is retained as incident history, not the current result.

Scope: local benchmarking and release checks only. No deployment, Lambda invocation, public website scan, or production data write was performed. AWS configuration reads confirmed all three approved scanner regions use 3,008 MB, x86_64, and a 75-second Lambda timeout.

## Local measurements

The reproducible local script and machine-readable results are retained in `artifacts/gpc-prod-review-20260913-24h/benchmark-release.ts` and `release-benchmark.json`. Each activity size has 50 measured iterations after five warm-ups. Each semantic scenario has 20 measured fresh-context iterations after five warm-ups. Browser routes are fulfilled locally, without target-site requests. The benchmark ran before the release gate, without competing browser tests.

| Component | Median | p95 | Retained JSON size |
|---|---:|---:|---:|
| Activity capture, 100 requests, one lane | 0.25 ms | 0.48 ms | 778 bytes |
| Activity capture, 1,000 requests, one lane | 1.23 ms | 2.61 ms | 779 bytes |
| Activity capture, 5,000 requests, one lane | 6.70 ms | 8.00 ms | 781 bytes |
| Baseline readback, CMP absent | 3.23 ms | 3.62 ms | 664 bytes |
| Baseline readback, CMP ready | 3.43 ms | 3.81 ms | 1,209 bytes |
| Baseline readback, queued stub | 3.25 ms | 3.61 ms | 681 bytes |

Semantic monitor installation took about 0.10–0.11 ms median and 0.12 ms p95, in addition to readback. Readback measurements include semantic parsing and serialization. Activity measurements include collection, hashing, validation, and serialization. These are component microbenchmarks, **not a before/after whole-scan or production Lambda latency benchmark**. They exclude complete-scan interaction effects, long-running mutation/listener activity, slow/unresponsive renderer behavior, and failed-terminal artifact verification. Readback still has its existing bounded timeout, which is much larger than these local fixture timings. No performance credit is claimed for the overlapping finalization or shared-readiness-budget improvements.

## Combined cost planning

Use 100,000 scans/month, 30-day retention, 2.9375 GiB per invocation, and an illustrative x86 duration rate of $0.0000166667/GiB-second, with no free-tier or discount credit. See [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/). This is a planning model, not account billing or a measurement of regional production execution.

At the high-activity fixture p95, charge two activity collectors plus baseline semantic setup/readback, and conservatively charge the coordinator for the longer added worker component too: about **31.85 aggregate billed milliseconds per scan**, or **$0.16/month**. Summing component p95 values is an envelope, not a statistical whole-scan p95.

Sensitivity allowance:

- Five times the local component envelope: **$0.78/month**. The multiplier is a planning scenario, not a measured Lambda slowdown.
- One newly prolonged failed coordinator per 533 scans, charged for the entire 75-second function timeout: **$0.69/month**. One failed scan in the original cohort is only a proxy, not a measured frequency of this particular code path. Already-dispatched worker billing is not treated as a new invocation.
- Compact evidence storage allowance: **$0.04/month**, assuming approximately four retained copies of roughly 3 KB per scan at an illustrative $0.03/GB-month. This is an allowance, not a verified retention topology or regional S3 quote; request/transfer and existing-row metadata overhead must remain within the remaining reserve.

This sensitivity case totals about **$1.51/month**. Recommend a **$2/month incremental release budget** at 100,000 scans/month, subject to owner approval and ordinary-scan follow-up. It is not a hard upper bound: higher failure frequency, slower readbacks, larger histories, or more retained copies can exceed it. Do not infer approval from earlier separate “below $1” estimates, or deploy based on a claim that the combined package is proven below $1/month.

Lower-cost alternatives are to hold the release or narrow it to the existing finalization/navigation repairs and local-only diagnostics, deferring new baseline semantic capture and failed-terminal retention. That reduces evidence coverage and requires a separately verified narrower release; no such narrowing was performed here.

## Release gate

The final `pnpm preflight:fast` **failed**, exit code 1. Its log is `/tmp/gpc-final-release-preflight.log`. The failure was the existing `waits for a safely actionable rerendered OpenAI Reject control through bounded canonical geometry` fixture at `packages/certscore-scan-core/src/post-refusal-observer.test.ts:212`: `resolver.found` was false after approximately 30.54 seconds. The same fixture passed in isolation in 1.18 seconds (`/tmp/gpc-final-release-reject-isolated.log`). This establishes intermittent behavior, not its cause; no assertion was relaxed and the isolated pass does not clear the release gate. Resolve the failure and rerun the full gate before release. Checks later than the failing post-refusal release command did not run in this invocation.

Before that failure, the GPC release checks, public-web typecheck, 486 canonical-projection tests, and 381 contract tests passed. Historical compatibility replay passed again: all 532 stored GPC assessments and California policy outputs remained exactly unchanged. No scoring or production presentation changes were made for this benchmark.

Source identity was unchanged before/after the gate: HEAD `de59580c6b7069d4a218683950f15ddba4e9cf18`, 36 changed/untracked non-documentation source files, aggregate source SHA-256 `725508f13d231054e711965016b576f74e6fe50c6cec75b94624ced3bf6775bb`. This identifies the dirty working-tree source tested, not a committed release. The local `release-source-fingerprint.ts` script records its hashing method.

## Reject rerender failure: root cause and repair

The failure was reproduced with Playwright API tracing, not just inferred from the assertion. At `17:28:29.138Z`, `locator.isEnabled` began waiting for the removed `#openai-initial-reject` button; it failed at `17:28:59.141Z`, approximately 30 seconds later. The resolver had only a two-second search budget. The trace is retained in `/tmp/reject-rerender-repeat-before.log`.

The named and canonical Accept/Reject resolvers now use a shared enabled-state lookup capped at 100 ms and the remaining search deadline. Exhausted deadlines and missing controls return unavailable. This preserves native Playwright enabled semantics and the original ordering of independent label and final hit-target checks. No default timeout was increased, no retry/session was added, and the original rerender assertion was unchanged. The fix adds no browser call and no estimated recurring cost increase.

A deterministic removal-between-checks regression was added to `cmp-control-actionability.test.ts` and included in the release gate. All six actionability tests passed; the previously failing rerender fixture passed ten consecutive isolated runs after the repair; scan-core typechecking passed. The fresh full `pnpm preflight:fast` completed with exit code 0; its log is `/tmp/gpc-release-rerender-fixed-preflight.log`. This includes the original rerender assertion in both action-check executions, GPC checks, web/worker checks, canonical projections, consent fixtures, policy capture, Lambda orchestration, and database compatibility/typechecking.

The repaired source has HEAD `de59580c6b7069d4a218683950f15ddba4e9cf18`, 40 changed/untracked non-documentation source files, and aggregate source SHA-256 `e1bbf3f8c3f0d7503ed125a5a0cb7b0cd85812d664b37929ebb6722e4457e723`. It remained unchanged through the passing gate. Historical compatibility replay again preserved all 532 assessments and their California policy outputs. This remains a tested dirty working tree, not a committed or deployed release.

Owner approval now covers release and the combined incremental cost allowance. Before deployment, require a clean committed release revision and the passing applicable release gate. Update web/materializer and validation-worker contract consumers before scanner promotion. After release, compare ordinary-scan cohorts by revision, region, and CMP: overall completion, verified-accessible completion, paired impact coverage, access patterns, lane duration, and artifact size. No recovery uplift is established by this local benchmark.
