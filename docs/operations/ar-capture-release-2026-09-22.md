# A/R corrective release — September 22, 2026

This release corrects evidence coverage, control-label interpretation and reporting
of already verified independent-session actions. It does not promote a new
human-adjudicated consent benchmark or claim a higher production success rate.

## Final correction

A successful atomic DOM read can occur while the HTML parser is still loading.
The scanner now reads document.readyState inside that existing atomic evaluation.
A loading snapshot retains its scripts, frames, storage, collection inventory and
network evidence, but marks runtime coverage limited_partial with
runtime_page_inventory_document_loading. Exhausted atomic reads and their existing
retry similarly remain limited with runtime_page_inventory_unavailable.

There is no added browser evaluation, retry, wait, lane, model call, timeout or
publication. The fixed bounded coverage diagnostic fits the existing disclosed
below-$0.10/month metadata allowance at 100,000 scans; its incremental contribution
is estimated below $0.01/month. No new infrastructure capacity is introduced.

The streamed-document Chromium fixture reproduces a completed snapshot before the
parser finishes. It verifies retained positive evidence and limited coverage. A
fully parsed counterpart remains usable. Timeout, rejection and successful retry
fixtures remain covered. Existing records are not reclassified from timing guesses.

## Live diagnostic disposition

The prior seven matched Ireland pairs remain recorded in the clean validation
report: total successful paths 4→4; Reject observed 1→3; confirmation subset 2→1;
median paired duration −41ms and sample p95/max +7,884ms. That latency observation
has not been turned into a pass.

BBC's current policy barrier was slower and its recovered Reject used the existing
2.775s action tail. Qualys' unfinished Reject was terminated under the unchanged
limited-passive barrier policy. These are retained outcomes, not discarded outliers.
The script-count differences on Ulakbim and ZHAW are not claimed recovered. The
correction makes a still-loading snapshot's incomplete coverage explicit.
BBC's GPC semantic probe correctly remains limited when not ready; no new wait or
weaker completion condition was introduced.

Luna reviewed the canonical calibration policy and distinguishes this corrective
release from initial consent-baseline promotion. The initial 95% adjudicated
accuracy and +0.5s/+2s latency gate remains unproven/failed for the diagnostic
sample. Scoped corrective acceptance requires fixtures, retained replay, final
preflight, canaries and evidence that identical work adds no browser operations.
It is not a waiver or a new claim of whole-scan latency neutrality.

## Coupled changes

- Canonical reporting retains verified independent-session A/R actions even when
  the passive session had unknown or absent controls. It does not change passive
  visibility, registration, finding eligibility or scoring rules.
- The observation-only phrase registry gains reviewed exact contextual aliases.
  Click authorization and action vocabulary remain unchanged.
- Structured incomplete consent evidence remains unknown rather than becoming
  unsupported absence on new canonical materialization. Historical states remain.
- Action storage diagnostics distinguish empty, complete, sampled and failed reads.
- Resolver and final proof use the same label fields; button submission values
  cannot impersonate a visible label. Label changes and ambiguous choices still veto.
- SDK 0.2.12 and MCP 0.2.22 describe both successful execution statuses and keep
  confirmation separate. Public version metadata and agent guidance are aligned.

Historical replay: 1,233 production scans excluding ErgoVeritas; 1,232 stored
assessments preserved; 304→319 existing successful actions exposed; no replay
errors and source cohort hash unchanged. Recomputed invalid absence states move
to unknown only in the new materialization policy; this does not rewrite storage.

The clean-validation report remains the historical record. This report records the
subsequent correction and release decision. Operational verification is recorded
with the final release artifacts, not inferred from local prototype results.
