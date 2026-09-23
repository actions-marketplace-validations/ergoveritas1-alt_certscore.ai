# A/R capture and reporting corrections — September 22, 2026

Implementation is local. No deployment, database backfill, package publication or
remote Mac mini bot update is included.

## Changes

- A verified completed click from an independent action session remains reportable
  when the passive session has an unknown or absent control. API, Pulse coverage,
  both timeline implementations and persisted checklist filtering share this rule.
  A Limited capture remains Limited; passive observations and scoring are unchanged.
- SDK 0.2.12 adds typed execution and `isSuccessfulChoicePath`. MCP and developer
  documentation count both success statuses and show confirmation separately.
  Registered paths do not need an `afterAction` object to count as successful.
- Observation registry v6 adds 16 exact contextual multilingual/necessary-only
  phrases. Action vocabulary and authorization are unchanged.
- Assessment projector 2.2.1 prevents a generic complete inventory from overriding
  current same-document incomplete/invalid structural proof or unresolved control
  semantics. It preserves positive evidence and later complete primary inventories.
  Historical assessment versions and conclusions are unchanged on read.
- Versioned diagnostic storage metadata distinguishes empty, sampled, partial and
  failed reads, with per-channel retained counts. It is retained through typed
  packets/projections and does not change execution or finding eligibility.
- Follow-up runtime correction: when both fast-mode consolidated snapshot reads
  fail or time out, the producer marks its module partial and the canonical
  runtime coverage retains `runtime_page_inventory_unavailable`. Empty fallback
  rows cannot imply successful inventory capture. Independently retained network
  evidence is preserved, and successful retries remain usable. This correction
  changes no capture, retry, timeout or late-result behavior.
- Follow-up action correction: discovery and final proof share the same label
  sources. Button submission values cannot create false candidate matches or
  false ambiguity. The final semantic veto, uniqueness and authorization checks
  remain unchanged. This alignment passes 104 observer/multilingual/semantic tests,
  three late-proof checks and scan-core typecheck, but postdates the latest live
  Ireland run and still needs fresh release validation.

## Measured local verification

Frozen production cohort: September 19, 18:05:19 UTC–September 22, 18:05:19 UTC;
1,233 scans after excluding 222 ErgoVeritas scans.

| Check | Result |
| --- | --- |
| Source-backed successful paths exposed by eligibility/API replay | 304 → 319: +10 Accept, +5 Reject (+4.9%) |
| Reviewed semantic shortlist recognized by observation classifier | 19/19 scan-intent pairs: 7 Accept, 12 Reject |
| Shortlist accidentally authorized by new action vocabulary | 0/19 |
| Historical assessment versions/control states preserved on read | 1,232/1,232 (one failed scan has no assessment) |
| A/R capture regression, including browser fixtures | 314 passed; 8 coordinator checks passed |
| API/report/Pulse/persisted-projection regression | 104 passed |
| MCP text and structured bundle regression | 59 passed |
| SDK regression | 29 passed |
| Action observers, storage helper and packet/projection contracts | 138 passed |
| Final browser denied-storage and per-phase retained-count checks | 3 passed |

The added malformed-inspection materialization test also passes (42 projector tests).
Web, contracts, scan-core and MCP typechecks and client builds pass.

The follow-up correction passes four real-Chromium deterministic timeout/error/
recovery fixtures, 14 runtime-coverage checks, 48 GPC and bundle-retention checks,
one existing pre-consent integration fixture and the scan-core typecheck. The
exhausted-read fixtures failed before the correction (completed instead of partial).

The 15 restored paths already existed; this is a presentation correction, not a
new click or observation. The 19 recognized shortlist pairs are evidence-backed
classification tests, not a measured production lift or automatic historical
relabeling. A broader diagnostic projector replay has differences from stored
materialization inputs; its counts must not be advertised as production error-rate
changes. Source cohort bytes were unchanged.

## Resolver investigation and remaining validation

The original 39 discovery failures mostly had no qualifying control in their
independent action session (34/39). Of 12 originally grouped as target/redirect
failures, eight were actually label-verification failures, three exact-target
mismatches, and one redirect-resolution timeout. No general safe runtime recovery
was established; no speculative selector, URL authorization expansion or longer
wait was implemented. The original 39/12 ceilings are not expected recoveries.

Fresh matched local scans through verified Ireland egress are now complete as a
diagnostic check: five matched sites improved from three to ten observed A/R
controls, preserving all three successful paths. A sixth site returned a no-go
and its second scan was skipped. One pair lost runtime inventory and the small
cohort exceeded the strict latency thresholds, so release validation is not yet
fully passing. See [the Ireland validation report](ar-capture-ireland-validation-2026-09-22.md)
for scope, evidence, timing, contact accounting and remaining checks. The earlier
frozen replay and deterministic fixtures did not contact audited websites; this
separate live validation did. Deployment and SDK publication remain separate
release steps. The remote bot needs its local aggregation updated to the canonical
execution predicate; SDK types alone cannot alter its aggregation.

The [subsequent follow-up](ar-capture-followup-2026-09-22.md) corrected exhausted
runtime snapshot coverage and found complete script/collection inventories in all
six fresh scans. Qualys retained confirmed A/R successes, but ZHAW's current
Accept stopped at a conflicting final label. Deployment remains on hold for that
selection/proof mismatch and clean release-gate validation.

## Cost and latency

No new lane, invocation, timeout, retry, model call, object write or retention
extension. Metadata adds bounded bytes to existing artifacts. Incremental cost is
estimated below $0.10/month at 100,000 scans/month with existing capacity and 30-day
retention. No extra network wait is introduced. Fresh paired scanner timing was
measured on five sites: median delta +634 ms and nearest-rank p95/max +3,154 ms.
The small cohort does not establish latency neutrality or a production p95;
the validation report records the unresolved checks.

Private diagnostic evidence is under `artifacts/ar-prod-review-20260922-72h`,
including `implementation-replay.json`, `shortlist-implementation-validation.json`
and `resolver-opportunity-review.md`. These artifacts are not source fixtures or
production evidence replacements.
