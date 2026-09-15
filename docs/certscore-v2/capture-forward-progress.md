# Bounded capture forward progress

## Policy evidence retention

Completed speculative policy recovery is merged into the lane's observations
and artifact references even when it did not retain a governing document.
Governing-document eligibility controls early exit and downstream interpretation;
it must not control whether failed, incomplete, or index observations survive.
The existing 32-row packet cap preserves the selected index child, including a
failed child, ahead of unselected regional links. Failure remains failure.

## Consent frame reads

The rapid inventory reserves a small handoff margin inside its caller deadline.
Each child-frame read terminates within that existing deadline. A stalled child
frame contributes explicit inaccessible-frame coverage rather than replacing
completed main-document evidence with a blanket DOM timeout. Unknown/CMP frames
remain blocking; existing detached/media-frame rules are unchanged. Late probe
installation cannot start another inventory read after its deadline has passed.
No control, action, or absence is inferred from an inaccessible frame.

## Form snapshots

Form crops use the existing Chromium session and screenshot budget. They capture
already-painted pixels through CDP rather than waiting for all page fonts. The
retained form binding is checked first; document URL, form bounds, and all input
rectangles must match before and after capture. CSS animation is temporarily
paused and restored. Inputs and editable controls are masked in memory before
review, persistence, or any returned image. Changed layouts fail closed.

Native output is bounded to 640 by 960 pixels, the existing review/size limits
remain, and the existing safety reviewer must approve every displayed image.
Raw pixels are never written to an artifact or sent to the reviewer. Missing or
withheld images remain unavailable, with their typed reasons.

No new browser, scan lane, retry, model call, or overall deadline is added. Small
in-memory masking work is estimated below $1/month at 100,000 scans (under
100ms average additional work would be about $0.49 compute at 3,008MB); capturing
smaller native images and removing font waits should offset that overhead. No
provisioned-capacity or retention change is included.

## Approved declared-policy text allowance — September 15, 2026

The product owner approved up to $15/month incremental compute at 100,000
scans/month for this recovery. Only the selected regional policy-index child shares a 5,000ms total allowance across
HTML and declared text. When that HTML explicitly declares OneTrust notice text,
resolution receives up to 2,500ms from resolution start, capped at 5,000ms from
document-fetch start and at the existing policy-lane deadline. A slow HTML fetch
consumes the shared allowance; it never starts another full allowance for text.
Ordinary material GDPR supplements retain their original 2,500ms shared cap. The allowance
covers one declared notice and one unique metadata policy URL; existing locale,
ownership, retained-text, and downstream eligibility checks remain unchanged.

No new lane, browser, retry, model call, or overall lane deadline is added.
Worst-case additional compute is approximately $12.25/month at 100,000 affected
scans and 3,008MB Lambda memory; actual use is limited to qualifying child
documents. Approval ceiling is $15/month. The lower-cost alternative was the
previous retention repair with the original shared 2,500ms child allowance.

Capture diagnostics retain only fixed stage/code values for rapid-inventory timeouts and form capture failures. They contain no form values or raw browser errors, add no browser work, and are estimated below $1/month in bounded logging overhead.

## First-layer inspection v2

New geometry uses `control_specific_inspection.v2`. V1 verification retains its
original candidate relevance and structural-role rules. V2 excludes occluded
controls from the relevant first-layer inventory and recognizes the exact
OneTrust banner wrapper and the registered vendor-list structure as information
and vendor navigation. Conflicting labels, unregistered lookalikes, and genuine
unresolved decision controls remain limited.

Geometry prioritizes visible containers and controls before existing caps. It
retains hidden candidates when space permits; dropping only inspected hidden or
off-viewport candidates does not mark the first-layer inventory truncated.
Dropping any potentially visible first-layer candidate still limits coverage.
Uncaptured, changed or incomplete frames and document mismatches remain limited.
No cap, browser, retry, or lane deadline increases.

Form crops scroll the bound form into view and use viewport capture when it
fits. Scroll is restored afterward. Masking, geometry consistency, safety review
and the total existing capture deadline are unchanged.

## Browser capture work reduction (September 15 follow-up)

The first deployed fix retained CNN's regional policy document, but a fresh
EU-Ireland run still exhausted form pixel capture and consent geometry work.
The follow-up keeps all existing time, lane, image-size, review and model budgets:

- Rapid first-layer inventory executes as one self-contained browser call. It
  does not depend on a mutable installed page function or extra probe round trips.
- Geometry checks visibility for every candidate but retains only eight hidden
  diagnostic candidates for expensive detailed geometry. Every potentially visible
  candidate still participates in the existing truncation/coverage checks.
- Form animation suppression is scoped to the crop subtree. Original attributes
  and scroll are restored, and JPEG capture requests Chromium's speed optimization.
  Masking, document/layout binding and fail-closed display review are unchanged.

These optimizations add no recurring cost, browser invocation or capture time.
Production effectiveness must be checked with fresh retained evidence; passing
fixtures alone does not establish complete CNN capture.

## Consent capture scheduling follow-up

Fresh production run 3e65a0f8-4058-4518-9d9d-f6003923d31c still failed
form pixel capture and completed its structured control read only near the
36.5-second consent module deadline. Adaptive-gate setup included unbounded
page/locator metadata reads, and supplemental full-page capture could precede
needed geometry. The scheduling correction:

- Uses one 300ms-bounded metadata call for scripts and mutation counters. Missing
  metadata is explicit internally and cannot authorize stable-partial early exit.
- Bounds semantic checkpoint work to its existing slice.
- Reserves four seconds inside the existing consent-proof module deadline for
  retained geometry/finalization, without adding observation time.
- Defers generic supplemental full-page work while structured controls still
  need geometry; geometry-driven below-fold capture remains available.

No recurring-cost increase, deadline increase, new lane or model call is introduced.
The separate proposed form screenshot slice increase remains unimplemented
pending explicit approval of its incremental compute/storage allowance.

## Preserve structured evidence across independent recovery

Production scan 8e1ab877-0930-47a8-81f5-e7c8d15dcdd9 exposed an additional
retention defect: an independent recovery wrote interactive-document geometry
over the primary artifact, while merged controls and coverage implied completion.
Recovery now requires verified complete structural inspection and matching actual
CDP loader readbacks before/after capture. An incomplete recovery writes only its
diagnostic artifact. Completed recovery replaces the typed observation as a whole;
it cannot merge controls or document identity from another session.

Before independent fallback, the scanner verifies the retained geometry proof,
candidate inventory, document token and typed observation binding. A complete
structured packet suppresses a fresh-browser fallback even if same-session visual
capture failed. Visual availability remains separate under contract 2.1. A
screenshot-only fallback cannot alter the retained consent observation. No image
from an earlier session is bound to a new recovery document.

This preserves evidence and reduces redundant browser work. Local proof validation
and bounded CDP readbacks stay within existing budgets and add no paid API calls
or storage policy changes; no net recurring-cost increase is expected.
