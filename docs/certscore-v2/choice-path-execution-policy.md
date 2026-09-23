# Accept and Reject path success

Owner-approved policy: `choice_path_execution.v1`, September 14, 2026.

## Meaning

| Operational outcome | Required evidence |
| --- | --- |
| Succeeded | A verified completed control click and a completed bounded after-action observation path. Consent registration may remain unconfirmed. |
| Succeeded with confirmation | A completed path plus a verified consent decision corresponding to the chosen action. |
| Limited | A path cannot be verified as complete, including an uncertain click, interrupted capture, changed target, lost requests, or missing required capture evidence. Confirmation alone does not establish path completion. |
| Not attempted / Unsupported | The retained typed action result explicitly reports that outcome and no completed click is established. |

For aggregate metrics, total successful paths includes both `succeeded` and
`succeeded_with_confirmation`. Report the confirmation subset separately.
`Click completed / Button observed` measures activation coverage;
`Path succeeded / Click completed` measures observation completion;
`Succeeded with confirmation / Path succeeded` measures confirmation coverage.
Counts describe scan paths, not the number of duplicate DOM elements.

## Canonical implementation

Verified retained action packet → typed report projection with `execution` →
persisted runtime projection → canonical concern/checklist evidence and API/report
presentation. The source packet hash and existing proof remain attached to the
projection. The execution object has its own version and retains click completion,
observation completion, and consent confirmation independently.

The shared assessment uses the validated retained after-action capture for
unconfirmed paths. A completed window requires the completed activation, the
existing time/reference checks, no lost post-action requests, and the required
storage snapshot. Zero requests is a valid completed observation.

The registered branch retains `registeredObservationCompletion` from the verified
packet's registration timestamp, observation duration, terminal timing, and exit
reason. It requires the elapsed window or an approved evidence-satisfied early
exit with retained observations. Confirmation or projectability alone cannot
establish completion. An abort, capture truncation, or exhausted result budget
remains limited. No new timeout, retry, lane, model call, or later publication is
introduced.

Historical typed projections remain readable and unchanged in storage. The
canonical compatibility assessment can summarize their already-retained proof;
it cannot fill missing capture evidence or upgrade a consent decision. A historical
registered projection without explicit completion evidence remains operationally
limited until its verified original packet is canonically materialized again.
This does not change its stored registration or finding eligibility. New
materializations persist the versioned execution and registered completion objects
and validate agreement with the source projection. No automatic backfill occurs.

## Findings and scoring

Execution success is operational metadata. It does not change observation
eligibility, registration, consent honoring, `productionProjectable`, checklist
finding status, or score. The existing registered post-Accept/post-refusal rules
and the separately approved Reject-click tracking policy continue independently.
API `status`, `verdict`, and `evidenceDisposition` retain their existing meanings;
the sibling `execution` object carries operational success.

## Bounded terminal confirmation

`bounded_terminal_consent_decision.v1` permits one semantic read during the final
250 ms of an already-running, dispatch-relative after-click window. It uses the
same action-specific decoder and original pre-action baseline. The read does not
poll, start another observation window, or delay packet finalization. A result
that finishes after the original deadline is discarded.

The optional `terminalDecisionEvidence` is retained in the action packet and typed
projection. It requires a matching verified decision, fresh state hash, explicit
read/write timing, the authorized target hash, completed click, completed capture,
retained storage snapshot and no post-action request drops. Cancellation or target
drift invalidates it. The canonical execution assessment consumes this proof only
with the verified source packet hash.

This field can add **Succeeded with confirmation**. It must not replace the
initial registration fields, backdate registration, relabel after-click requests
as post-registration requests, or suppress the separate Reject-click tracking
assessment. The finding title is “Tracking after Reject click”; the historical
“decision unverified” title remains an alias. Its timing and registration proof
remain in the retained evidence.

## Action recovery

The canonical action classifier recognizes the exact, context-bound labels
“Accept additional cookies,” “Nur erforderliche,” and Ketch's “Reject all
non-essential.” Acknowledgments, transactions, conflicting choices and generic
buttons without consent context retain their existing guards.

The action resolver considers the full bounded recipe registry during geometry
discovery. A named semantic decoder must bind to the live control's registered
banner ancestry, including shadow hosts, rather than merely a background CMP
script. Ambiguous scopes cannot select a decoder. Geometry and control binding
share the original outer deadline; an expired geometry slice is not a disabled
button. Cookie-name routing hints share the geometry deadline as well.

Accept uses Reject's committed-document navigation recovery for recognized
recoverable navigation errors, with no new navigation or settle wait. A timeout,
uncommitted document or unauthorized target remains limited. Action workers record
five bounded local checkpoints in the existing failure-diagnostic path; checkpoints
do not establish a completed click or create evidence.

## Cost and verification

Estimated additional storage: under $0.10/month at 100,000 scans and 30-day
retention, allowing duplicated small execution objects in existing projections.
No additional browser/model invocations or observation time.

Recovery/terminal-read additions are estimated at $0.10–$0.50/month at 100,000
scans and 30-day retention, allowing bounded metadata, local checkpoints, and
short DOM/semantic reads that overlap existing browser windows. No provisioned
capacity, invocation, model call, retry, or window/tail increase. The recovered
captures use the already approved full-window compute allowance ($30–$60 per
100,000 scans affected on both unverified paths).

Regression coverage includes completed unconfirmed capture, confirmed completion,
confirmed but interrupted observation, evidence-satisfied early exit, missing
proof/hash, missing storage evidence, dropped requests, wrong request references,
tampered execution status, persistence round trip, canonical finding/score
separation, public API validation, and report rendering.

## Independent-session report eligibility and client counting (September 22, 2026)

A schema-validated, source-bound action projection with a verified completed click
is reportable even when the independent passive session has an unknown or absent
control. This includes factual Limited paths; reportability does not imply success.
The shared API/report eligibility rule consumes the typed projection. Existing
canonical checklist rows may also retain that execution evidence. Neither path
creates a finding, changes the passive A/R/O assessment, or changes registration,
projectability or scoring. Coverage notices use the same eligibility rule.

SDK `ChoicePathExecution`, the `isSuccessfulChoicePath` helper, MCP text and developer
examples use both success statuses. A registered successful path may lack the
optional `afterAction` object; that object must not be the success predicate.
Historical missing execution remains unavailable and belongs in a separate coverage
count. SDK 0.2.12 contains these client additions; publication is a separate release
step. The Mac mini bot must adopt this predicate in its own code; a server change
cannot rewrite its local aggregation logic.

Optional `storage.collectionDiagnostics` in typed action packets (retained as
`storageCollectionDiagnostics` in typed report projections) uses `action_storage_collection_diagnostics.v1`. Per-phase cookie,
local-storage and session-storage metadata distinguishes empty, complete, sampled,
partial and failed collection. The existing packet hash binds this metadata.
Historical packets may omit it; missing diagnostics must not mean empty or complete.
This metadata is diagnostic only and does not redefine path success or finding
eligibility. No raw storage values, extra browser calls or public wire fields are
introduced.

These changes add no lane, invocation, timeout, retry or runtime model call.
Diagnostics add bounded bytes to existing artifacts/projections. Estimated
incremental cost is below $0.10/month at 100,000 scans/month with existing capacity
and 30-day retention; this is a planning estimate, not measured billing.
