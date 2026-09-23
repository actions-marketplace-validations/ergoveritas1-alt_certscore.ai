# A/R inventory and timing follow-up — September 22, 2026

The missing-inventory coverage defect is fixed locally. The focused Ireland
follow-up did not reproduce the inventory loss, but did expose a separate Accept
selection/proof failure on ZHAW. Deployment remains on hold. No implementation
commit, push, SDK publication or deployment was performed; calibration contact
metadata alone was committed.

## Correction and deterministic verification

Real-Chromium fixtures reproduce exhausted fast-mode atomic snapshot timeouts and
rejected reads while retaining actual network requests. Before the correction,
both cases reported a completed module. The producer now records a fixed, bounded
error when its atomic read and existing retry both return no snapshot. The
existing canonical module/coverage path yields `partial` and `limited_partial`,
with the specific `runtime_page_inventory_unavailable` limitation. Missing rows
do not establish absence; independently retained observations remain available.

Both error recovery and timeout recovery remain usable when the existing retry
succeeds. Capture behavior, timeout lengths, retry count and late-result handling
are unchanged. This is an honest-coverage correction, not a claim that renderer
timeouts have been eliminated. It addresses the reproduced production fast-mode
path, not every possible legacy full-mode collection failure.

Verification: four timeout/error/recovery browser fixtures, 14 runtime-coverage
checks, 48 GPC/bundle-retention checks, one pre-consent integration fixture and
scan-core typecheck passed. The two exhausted-read fixtures failed before the fix.
No downstream finding or score shortcut was introduced.

The repository's general ownership wording conflicts with its active deployment
topology. WS01's production prohibition and the canonical calibration program
explicitly locate production scanner changes in WC01's v2 DAG packages. The fix
uses that existing production producer; the historical WS01 scanner is unchanged.

## Six-scan live diagnostic

Luna reviewed the correction and approved one baseline/current pair each for
Ulakbim (inventory), ZHAW (policy timing) and Qualys (positive action comparator).
All six scans completed and verified retained bytes and canonical persistence.
The baseline remains `f226a5a2b37eb8d2725c2cccba5eeb94a01b8663`; current source
hashes are retained per run. Both variants use the current localhost projector.
This remains a targeted diagnostic, not the full release acceptance cohort.

Browser, HTTP and TLS traffic used verified Ireland egress `63.33.9.201` through
the existing eu-west-1 proxy. All 24 passive-worker preflights matched; action
workers shared the same verified proxy configuration. No ErgoVeritas or blocked
PostNord target was contacted.

| Matched three-site measure | Baseline | Current |
| --- | ---: | ---: |
| Observed Accept controls | 2 | 3 |
| Observed Reject controls | 1 | 3 |
| Completed clicks / successful paths | 3 | 2 |
| Confirmed successful paths | 2 | 2 |

All six runtime lanes retained 40 script rows and collection-surface inventory.
Ulakbim's atomic read completed in 9 ms baseline / 92 ms current, without the
previous exhaustion. Both variants therefore correctly report usable runtime
coverage. Other network/vendor counts vary between sessions; this is not evidence
that all raw observations should be identical.

Qualys completed and confirmed both Accept and Reject in both variants. Ulakbim
attempted neither action in either variant. ZHAW's baseline Accept succeeded with
unconfirmed registration; its current Accept was not attempted, so this follow-up
does **not** preserve all baseline action successes.

The ZHAW current Accept packet retains the same canonical Accept recipe ID as the
successful baseline, but its final label inspection reads
“Nur notwendige Cookies akzeptieren” and returns
`resolved_control_label_conflict:semantic_veto`. The guard correctly prevents an
Accept dispatch on that control. The canonical resolver uses positional live
locators, so DOM changes between selection and proof are a plausible explanation,
but the retained evidence does not prove a node reorder. Investigate candidate
binding/label sources with a local reproduction; do not weaken the veto, expand
action vocabulary or count the failed path as successful.

An isolated exact-label action-classifier replay under baseline registry v5 and
current v6 returned identical `unknown` / `conflicting_consent_decisions` results
for that necessary-only label. The final veto was not introduced by the new
observation vocabulary. Candidate selection also reads label sources differently
from final proof (including arbitrary button values), which is another lead to
test; the retained packet alone does not identify which mechanism caused the
mismatch.

The confirmed label-source inconsistency was then corrected locally: both action
resolvers and final selected-control proof now share one browser-serializable
field reader. Button submission values are excluded; button-like input values
remain labels, as before. Two loopback regressions failed before this alignment:
an opposite-choice button with a misleading submission value made a separate
correct control appear ambiguous. Both pass afterward and assert that only the
correct visible control is clicked. The changed-label guard still fails closed.
The older hidden-control test had a stale expected reason; isolated baseline
reproduced that failure, and the assertion now names the existing earlier scope
guard. No production guard was relaxed to satisfy it.

Validation of the alignment: 104 Accept/Reject observer, multilingual and semantic
proof tests, three late-proof guards and the scan-core typecheck pass. This
alignment was made **after** the six Ireland scans. Those results therefore do
not validate the latest source revision, and the alignment must not be claimed
to have fixed ZHAW without fresh evidence. It fixes a separately reproduced
resolver inconsistency; positional locator drift remains unproven.

## Timing interpretation

Current minus baseline scan duration was −6.236 s for Ulakbim and −2.082 s for
Qualys. No current action lane added time beyond the passive barrier. Two usable
pairs cannot establish a stable latency distribution or clear the full release
gate.

ZHAW was 29.861 s baseline / 15.943 s current, but is **excluded from latency
acceptance**: a final local browser fixture ran from 19:56:36.670 to 19:56:47.209
UTC while the baseline policy lane was active. The runtime lane had already
finished. Its inventory comparison remains useful; the apparent overall speedup
must not be credited to this change. The current policy lane duration was 15.926 s,
compared with 20.979 s in the earlier current run. These observations illustrate
variability; they do not establish its cause or prove latency neutrality.

## Accounting, cost and remaining work

The registry check, fresh central-ledger export and canonical selector passed.
The existing owner cooldown waiver applied; blocked/manual-hold checks remained
active. All six contacts were persisted with idempotent run key
`ar-capture-20260922-paired-ie-v2`. The reviewed repository candidate was merged
into the tracked diagnostic ledger without removing PostNord's blocked state.
A fresh central export verified the three updated domain records. Calibration
metadata commits are `a6f46e9a` and `d4e3eead`; implementation changes remain local
and uncommitted.

The initial two SSH attempts failed because IP-detection requests returned an
address that did not match the successful SSH route. Each temporary rule was
revoked. The successful tunnel was stopped after scanning, and independent AWS
inspection confirmed all three temporary rules were absent. No infrastructure
capacity was added.

Disclosed one-time follow-up estimate: below $0.25. Conservative model-cost meter:
$0.03454845, plus small existing proxy and metadata-task costs. The fixed diagnostic
adds bounded text only to existing artifacts, estimated below $0.01/month at
100,000 scans with existing retention, within the implementation's previously
disclosed below-$0.10/month allowance. No extra browser/model calls are introduced.
Label-source alignment also adds no reads or waits. Newly recovered clicks may
consume their existing after-action window and previously owner-approved compute
allowance; no window, tail cap or capacity increase is introduced. Zero added read
overhead does not mean identical latency for a path previously stopped before
clicking.

Next release work is fresh, clean paired validation of the latest alignment and
the normal release gate, with attention to ZHAW's remaining selection-to-proof
uncertainty. Current evidence
supports the coverage correction; it does not establish a higher production path
completion rate or a globally improved error rate.

Private retained diagnostics are in
`artifacts/ar-prod-review-20260922-72h/followup`, including source/config provenance,
`analysis.json`, per-scan verification, snapshot/lane timings,
`timing-confound.json`, egress and cleanup proof, and contact accounting.

Fresh clean validation is complete; see [the clean validation report](ar-capture-clean-validation-2026-09-22.md). The label fix passed its live check, but latency and runtime coverage acceptance remain unresolved.
