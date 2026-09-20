# Accept and form capture reliability — September 15, 2026

## Retained failures

Local full-site scan `5b5374b1-f2ec-4c18-9f97-8db7ef2b8fcf` completed ten pages,
but its Accept lane spent 14,001ms looking for a registered control and did not
click. Passive evidence retained the visible German Accept span. The canonical
DSGVO All in One / tarteaucitron registry had no Accept recipe, and generic
action discovery intentionally excludes plain spans.

The `/aktuelles/` form snapshot failed its before/after bounds check. That check
must remain fail-closed. The prior animation pause covered only the form and its
descendants, leaving ancestor and sibling motion able to move its crop.

## Changes

The versioned registry recipe binds the first-layer `tarteaucitronPersonalize`
control to the exact published `respondAll(true)` handler. The same id's reload
and preferences variants are excluded. Canonical live label, unique hit target,
scope, authorization and last-mile proof checks remain required. No generic span
fallback is added. One completed click plus bounded capture can establish path
success; hiding the banner cannot establish consent registration.

Form capture pauses at most 1,000 existing document animations at their current
frame and resumes only those it paused. This covers motion outside the form.
Capture still uses one screenshot, no settling wait, no retry, and the existing
2.5-second shared capture/masking/review deadline. Script-driven layout changes,
document changes and in-crop movement still discard the image before review.
Input masks, image limits and mandatory display-safety review are unchanged.

No lane, browser, timeout increase or additional model call is introduced.
Animation bookkeeping is estimated below $0.10/month at 100,000 scans assuming
under 20ms additional 3GB compute per scan. The recipe replaces unsuccessful
search work with the already-authorized bounded action path; no net compute
increase is expected for the affected target. These estimates are not hard caps.

## Verification

Deterministic browser tests cover one accepted action and successful typed path
projection, neutral unconfirmed registration, reload/preferences/duplicate/
out-of-banner rejection, moving ancestors and siblings, restoration of prior
animation state, one screenshot/review, and pixel masking. Existing tests retain
unsafe-review, document/binding, changing geometry and shared-budget failures.

Fresh localhost full-site scan `25ffc692-a502-4aca-9884-036cbb88def8` completed
ten pages in 77,441ms (previous run: 77,837ms). Accept resolution fell from
14,001ms to 6,022ms and its complete lane from 16,357ms to 10,710ms. The retained
single click and 3,005ms after-click capture produced **Succeeded** in the report;
semantic registration correctly remained unconfirmed. The `/aktuelles/` snapshot
was available, masked, safety-reviewed and opened successfully in the localhost
report. This is one target verification, not a general latency benchmark. Sitemap
discovery remained limited; all ten scheduled pages completed. No production
deployment was performed.
