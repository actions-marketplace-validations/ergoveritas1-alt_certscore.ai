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
scans/month for this recovery. A selected supplemental policy child keeps its
2,500ms HTML fetch cap. When that HTML explicitly declares OneTrust notice text,
resolution receives up to 2,500ms from resolution start, capped at 5,000ms from
document-fetch start and at the existing policy-lane deadline. The allowance
covers one declared notice and one unique metadata policy URL; existing locale,
ownership, retained-text, and downstream eligibility checks remain unchanged.

No new lane, browser, retry, model call, or overall lane deadline is added.
Worst-case additional compute is approximately $12.25/month at 100,000 affected
scans and 3,008MB Lambda memory; actual use is limited to qualifying child
documents. Approval ceiling is $15/month. The lower-cost alternative was the
previous retention repair with the original shared 2,500ms child allowance.

Capture diagnostics retain only fixed stage/code values for rapid-inventory timeouts and form capture failures. They contain no form values or raw browser errors, add no browser work, and are estimated below $1/month in bounded logging overhead.
