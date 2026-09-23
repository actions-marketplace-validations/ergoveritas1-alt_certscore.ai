# Clean Ireland A/R validation — September 22, 2026

Release readiness remains open. The latest label-source fix passed its fresh live
check, but this batch does not establish improved total path completion, unchanged
runtime coverage, or the required tail-latency acceptance. Nothing was deployed.

## Method and integrity

Fifteen sequential localhost scans used the existing Ireland proxy, with browser
and HTTP egress verified as 63.33.9.201. Seven domains have matched baseline/current
runs. NYTimes returned a canonical access-denied/bot-challenge no-go on its first
run; its second run was skipped and it is excluded from the matched comparison.
ErgoVeritas was excluded. No tests ran concurrently with scans. Frozen source
hashes were checked before every scan; variant order alternated.

The isolated scanner baseline is f226a5a2b37eb8d2725c2cccba5eeb94a01b8663.
Both scanner variants used the same current localhost WC01 projector (2.2.1).
This isolates scanner-source comparison; it is not a complete historical
control-plane versus current control-plane comparison.

All 15 runs passed original retained-artifact SHA-256/size verification, typed
packet validation, canonical persisted-projection comparison and local API reads.
Each published one terminal result. Four passive-worker egress proofs were retained
per scan. These checks prove integrity of retained evidence, not its completeness
against an independent ground truth.

## Matched results

| Metric | Baseline | Current |
| --- | ---: | ---: |
| Scans | 7 | 7 |
| Accept observed | 3 | 3 |
| Reject observed | 1 | 3 |
| Successful Accept paths | 3 | 3 |
| Successful Reject paths | 1 | 1 |
| Total successful paths | 4 | 4 |
| Confirmed-decision subset | 2 | 1 |

Success uses choice_path_execution.v1: completed click and completed bounded
observation, with confirmation reported separately. Independent action sessions
can succeed when passive control inventory is unknown or absent; these counts
must not be divided to imply a same-session conversion rate.

ZHAW Accept succeeded in both variants with the retained label “Alle Cookies
akzeptieren.” The earlier wrong-control proof veto did not recur. Its necessary-only
Reject label still fails the unchanged action semantic guard. Observation vocabulary
expansion does not authorize a new action vocabulary.

BBC gained a successful unconfirmed Reject path. Qualys lost a confirmed Reject
path: current passive inventory was limited and its unfinished Reject worker was
cancelled at the existing passive barrier. Baseline policy took longer, allowing
that independent worker to return before its barrier. This is a real lost outcome
in this sample, not a label-proof failure or evidence of causal regression in the
new resolver. Extending this wait would require a deliberate latency-policy change.

## Timing and coverage

Paired current-minus-baseline scan deltas: Segment −2,966ms; Mozilla −55ms;
ZHAW +1,722ms; Qualys −7,746ms; Ulakbim −3ms; IKEA −41ms; BBC +7,884ms.
Median is −41ms. Sample nearest-rank p95 equals the maximum, +7,884ms; seven pairs
cannot establish a stable production p95. The existing +500ms median/+2,000ms p95
acceptance is not passed. No timing pair was excluded for concurrent work.

BBC's current passive barrier was about 5.94s later, with policy the slowest lane;
its recovered Reject added 2.775s beyond that barrier. Baseline had about 0.786s
of Accept tail. Thus both passive-site variation and useful action capture contribute
to the observed 7.884s increase. No configured timeout or tail cap was increased.

All matched runtime snapshots completed and retained collection inventories.
The earlier exhausted-snapshot failure did not recur. Nevertheless, Ulakbim
retained 40 script rows in baseline versus 2 current, and ZHAW 40 versus 7.
Ulakbim's current navigation reached 15,002ms versus 12,845ms; both quiet gates
reached their existing 1,500ms cap. The current atomic snapshot completed in 9ms
at 17,053ms, while only 52 requests/34 responses had been captured; final network
retention reached 79 requests. Baseline had 79 requests/58 responses before its
10ms snapshot. This supports a still-loading-document timing explanation, but
it does not prove all later DOM evidence was captured. Do not claim inventory
parity or zero evidence-quality regression from this batch.

GPC bounded observation completed on 7/7 baseline and 6/7 current matched scans.
Current BBC retained main-document header/navigator delivery and complete request
capture but its semantic probe was not ready (semantic_probe_incomplete). It
correctly remained limited and score-neutral. Paired GPC response additionally
had frame changes during readback. This is separate from A/R path success.

## Disposition and next work

Keep deployment blocked on the unresolved latency/coverage acceptance. The most
useful next work is deterministic reproduction of late DOM loading and terminal
semantic-read readiness using retained timings, followed by an upstream bounded
capture fix only if reproduced. Preserve raw network evidence and distinguish a
completed snapshot from proof of settled page coverage. Do not add blanket waits,
rescan away failures, expand click labels, or convert uncertainty into absence.
Treat the Qualys barrier as an explicit existing completion/latency tradeoff.

The prior 174 focused checks and scan-core typecheck remain applicable: no
production source changed in this validation turn. This sample is diagnostic,
not human-adjudicated accuracy ground truth and not evidence of a 95% global rate.

## Operations and cost

A fresh central export verified all eight targets against the latest scan start
time (the repository candidate uses completion time). Luna reviewed the retained
diagnostics and also found release readiness unresolved; this is model-assisted
technical review, not independent human adjudication. All 15 contacts were persisted
idempotently under
ar-capture-20260922-paired-ie-v3. Reviewed repository metadata is in
ar-capture-calibration-2026-09-22/clean-manifest.json and clean-ledger.json.
The existing cooldown waiver applied; manual and blocked holds remained enforced.
The tunnel was stopped and its temporary SSH security-group rule was independently
confirmed absent. No infrastructure capacity was added.

Disclosed one-time estimate was below $0.50. The retained model meter totals
$0.0398885, excluding small existing proxy/metadata-task compute. No new recurring
cost was introduced by this validation. Existing implementation cost allowances
are documented in the follow-up report.

Private diagnostics: artifacts/ar-prod-review-20260922-72h/clean-validation,
including analysis.json, source freeze, original artifact verification, timing,
egress, cleanup and contact accounting. Local artifacts are not production results.
