# A/R capture: local Ireland validation — September 22, 2026

The diagnostic cohort confirms improved control recognition and preservation of
the three previously successful action paths. It does **not** establish a fully
passing release gate: one pair lost runtime inventory, and paired scan timing
exceeded the strict latency thresholds. No deployment, implementation commit,
SDK publication or remote bot update was performed.

The subsequent [inventory/timing follow-up](ar-capture-followup-2026-09-22.md)
reproduced and corrected the missing-inventory coverage defect locally, repeated
three pairs and found a separate ZHAW Accept selection/proof failure. The initial
results below remain an unchanged record of the first batch.

## Scope and method

Eleven local scans ran from 19:32–19:37 UTC: five matched site pairs plus one
blocked baseline site. No ErgoVeritas targets were included. The six targets were
selected for language/control coverage, with Luna reviewing the selection and
results; this is not a representative production error-rate sample or independent
human adjudication. It is smaller than the full 8–12-site release cohort.

Baseline scanner source was the clean commit
`f226a5a2b37eb8d2725c2cccba5eeb94a01b8663`, in an isolated worktree. Current
scanner source was the uncommitted implementation, bound by a source hash
manifest. Runs were sequential, with baseline/current order alternated.
Both variants used the **same current localhost WC01 projector (2.2.1)**.
Consequently this comparison isolates scanner-source behavior; it is not a full
old/new control-plane comparison. The separate frozen-cohort replay covers the
reporting and historical-assessment behavior.

Local browser, HTTP and TLS proxy paths were verified through the existing AWS
Ireland host in `eu-west-1`, with observed egress `63.33.9.201`. All 44 passive
worker preflight artifacts matched that egress. Action workers used the same
verified proxy configuration; they do not emit separate egress preflight packets.
Local database, object storage and six-lane simulation were asserted. Original
retained bytes, manifest pointer hashes, persisted action projections and single
terminal publication were checked for every scan.

## Matched results

| Measure across five matched sites | Baseline | Current |
| --- | ---: | ---: |
| Scans with observed Accept | 2 | 5 |
| Scans with observed Reject | 1 | 5 |
| Combined observed A/R controls | 3 | 10 |
| Completed clicks | 3 | 3 |
| Successful paths, including confirmed paths | 3 | 3 |
| Successful paths with confirmation | 2 | 2 |

| Site | Baseline A/R | Current A/R | Successful paths in both variants | Current minus baseline scan duration |
| --- | --- | --- | --- | ---: |
| mpsv.cz | unknown / unknown | observed / observed | None | −6,754 ms |
| zhaw.ch | observed / unknown | observed / observed | Accept | +3,154 ms |
| ulakbim.gov.tr | unknown / unknown | observed / observed | None | +634 ms |
| etersoft.ru | unknown / unknown | observed / observed | None | −568 ms |
| qualys.eu | observed / observed | observed / observed | Accept and Reject, both confirmed | +1,591 ms |

The seven additional observed controls validate the contextual observation
vocabulary. Those phrases are intentionally observation-only: this change does
not authorize seven additional actions or establish an improvement in click
completion rate. All three baseline successes were preserved. Qualys storage
diagnostics matched actual retained pre/post channel counts, including empty
channels. Limited and not-attempted paths were not counted as successes.

PostNord's baseline returned corroborated bot-challenge/no-go evidence. Its
current scan was skipped, and it is excluded from paired comparisons. No retry
or bypass was attempted.

Available ZHAW and Etersoft screenshots supported the label spot-checks. Current
MPSV and Ulakbim visuals were withheld because finalization/safety review was
unavailable; those images were not viewed or served. Their positive structured
control observations remain separate from visual availability under the canonical
assessment policy. No visual evidence was substituted or synthesized.

## Unresolved evidence and timing checks

**Ulakbim runtime inventory:** baseline retained 40 script events and a complete
collection-surface inventory with two fields; current retained zero script events
and no collection-surface inventory. Network events (94), cookies (2), vendors
(2) and journeys (33) remained present. Both variants nevertheless reported
runtime coverage as usable without limitation keys. Both encountered the atomic
runtime snapshot timeout; the existing bounded retry recovered the baseline
inventory but did not recover the current inventory. The runtime scanner source
was unchanged by this implementation, so this single pair does not establish
causation. The evidence loss is real and must not be dismissed as harmless
variation. Reproduce the exhausted snapshot path locally, check that missing
inventory is represented honestly, and resolve or bound its reliability impact
before release validation is declared complete. Do not add runtime code in the
wrong repository or repair missing evidence in a downstream display.

**Timing:** median paired scan delta was +634 ms; nearest-rank p95 was +3,154 ms
(also the maximum of only five pairs). These exceed the strict +500 ms median
and +2,000 ms p95 thresholds. All current action lanes added zero wait beyond the
passive barrier. ZHAW's policy lane increased from 15.801 s to 20.979 s and used
one rendered-policy recovery, versus none in baseline; its total scan delta was
+3.154 s. This points to policy-run variability rather than a newly added A/R
tail wait, but does not prove latency neutrality. Recheck after the inventory
concern is understood; do not advertise these five pairs as a stable production
p95 estimate.

GPC bounded observation completed on the five matched sites. Paired response
assessment was mostly indeterminate; ZHAW changed from no observable response to
indeterminate. Observation completion must not be described as GPC honoring, and
this cohort does not establish a GPC response-quality improvement.

## Operational accounting and cost

The registry check, central contact-history export and canonical selector ran
before site contact. The owner's existing cooldown override applied; blocked and
manual-hold exclusions remained enforced. All 11 contacts were persisted through
the canonical AWS one-off metadata workflow and verified by a fresh central-ledger
export. PostNord is blocked; the other five targets are in cooldown. A reviewed
repository-ledger candidate was subsequently committed with the diagnostic
manifest before the follow-up run, under
`docs/operations/ar-capture-calibration-2026-09-22`.
The shared canonical target manifest and repository ledger were not overwritten.

The temporary tunnel was stopped and its operator-only access rule revoked;
an independent AWS read confirmed the rule was absent. No capacity was added.
The disclosed one-time validation estimate was below $0.25; the conservative
metered model estimate was $0.05007815, with existing proxy and short metadata
tasks contributing a small additional amount. This is an estimate, not an AWS
billing reconciliation. Implementation recurring metadata overhead remains
estimated below $0.10/month at 100,000 scans/month with existing capacity and
30-day retention.

Private artifacts are under `artifacts/ar-prod-review-20260922-72h/live`, including
`analysis.json`, per-variant retained/persisted/API verification, the source
manifest, egress proof, timing, contact summary, post-run central ledger, cleanup
verification and model-cost summary. They are diagnostic evidence, not replacement
production artifacts or source fixtures.
