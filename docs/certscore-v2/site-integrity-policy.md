# Site integrity review policy v3

`certscore.site-integrity-policy.v3` implements a factual review and an owner-approved overall-score deduction for verified concealed outbound links. It does not classify a destination as adult, pharmaceutical, malicious or unrelated, establish unauthorized modification, or imply personal-data disclosure. Those conclusions require separate investigation.

## Canonical path

The production v2 runtime-evidence lane observes the starting page's main document during its existing passive consolidated snapshot. The coordinator retains only that lane's typed `certscore.site-integrity-observation.v1` in `CanonicalEvidenceBundle.json`. It does not borrow observations from consent, policy, GPC or action lanes. Following owner approval on September 17, 2026, additional-page inventory scans also run this bounded observer in their existing passive snapshot. They retain `certscore.site-integrity-observation.v2` with `additional_page_main_document` scope, plus producer-bound parent scan, page, attempt, configuration, interval and final-document identity in the existing evidence artifact.

After original bundle bytes pass the existing retained-artifact verification, materialization requires matching final document URL, runtime document token and capture time within the bundle interval. It persists `certscore.site-integrity-projection.v1`, including scan identity, original bundle SHA-256, observation SHA-256 and evidence reference. The projection enters normalized concern construction, concern policy and the owner unified finding `site_integrity_hidden_outbound_links`. Customer surfaces select only that projected finding.

Malformed, unverified, missing, mismatched or insufficient evidence cannot become a review finding. Historical reports are not backfilled, reinterpreted or promoted from manual observations or loose flags.

## Bounded observation and eligibility

The observer reuses the existing selected anchors, examines at most 1,000 anchors and six ancestors per anchor, and cooperatively stops after 20 milliseconds or 12 retained links. The existing snapshot recovery allowance is unchanged. It records off-screen positioning, a zero-size container with clipped overflow, or zero-font-size text. Restored visible text/positions do not qualify through their parent's styling alone.

It examines text-only anchors and excludes same-site destinations, navigation/menu regions, collapsed or explicitly hidden content, conventional screen-reader-only content, clipped accessibility labels, dialogs and links with child elements (including icons, images or styled text spans). Zero-size clipping does not qualify through an absolutely/fixed-positioned descendant that could escape the container. Only HTTP(S) external DNS domains are retained; destination paths, query strings, fragments, credentials, link text and destination content are not retained. Source page query, fragment and credentials are removed. Each link retains a capture-local reference, domain and concealment mechanism, alongside source page, timestamp and document provenance.

The concern policy requires at least one verified retained hidden outbound link. On September 17, 2026 the owner replaced the previous three-link/two-domain/two-method threshold with per-link scoring: 10 points for the first occurrence, 5 for each additional occurrence, capped at 40 per report. Strict evidence verification is unchanged. The finding does not establish that the content is unrelated or unauthorized.

## Presentation and scoring

Eligible evidence appears in a dedicated Site integrity section under Detailed evidence and, through the existing policy-eligible owner unified finding, a normal Priority review entry with a red “High priority” badge. The executive overview counts this entry with other priority issues; there is no separate integrity sentence or callout. JSON/PDF downloads preserve the evidence. Full-site reports group eligible page findings into one issue with affected pages and a Detailed evidence capture-coverage list. Historical starting-page v1 evidence stays starting-page scoped; missing additional-page evidence is explicitly unavailable. The initial presentation update was requested on September 17, 2026; the subsequent v3 scoring approval is described below.

The finding has no regulatory checklist mapping or effect on regulatory privacy issue counts. Its versioned concern-policy score effect reduces the overall score independently of regulatory checklist scoring. It joins the overall report priority list through the shared unified-finding adapter, independently of regulatory checklist top-finding selection. It does not establish a GDPR/ePrivacy or CCPA gap. Destination domains are displayed as inert text. User action: ask the site owner to compare retained domains and concealment methods against intended page content.

Additional-page original artifact bytes must pass existing hash verification, followed by parent/page/attempt/configuration, completed status, document and capture-interval checks. Verified projection v2 then follows the same normalized concern, concern policy and unified finding path per page. Eligibility thresholds are evaluated per page; weak observations cannot pool across pages to create a finding.

## Cost and verification

No additional browser session, invocation, request, navigation, click, model call, storage write, retry or timeout is introduced. Only bounded work and bytes are added to existing artifacts. The original starting-page-only estimate is below $1/month at 100,000 scans/month: up to two cooperative 20 ms snapshots at an assumed 4 GB memory allocation is approximately 16,000 GB-seconds, about $0.27 at $0.000016667/GB-second. Up to roughly 8 KB per retained observation/projection copy across eight existing serialized copies is approximately 6.4 GB/month, about $0.15 per month of object retention at $0.023/GB-month. At three months of retention plus compute this is approximately $0.72/month. These are planning assumptions, not measured billing; reevaluate if scan volume, memory, copy count or retention grows. Existing database capacity is unchanged. This below-$1 estimate is within the repository's pre-approved threshold and was disclosed during implementation.

Focused regression coverage includes a real local browser fixture, lane ownership, retained-document verification, strict contract rejection, concern/policy/unified projection, score caps, first-link eligibility and duplicate evidence protection, checked persistence, JSON/PDF export and conditional report rendering. No live public-site scan or production deployment is required for these checks.

The owner approved the additional-page implementation and approximately $6–10/month incremental cost at 100,000 ten-page full-site scans/month on September 17, 2026. See [sitewide scope and cost assumptions](./site-integrity-sitewide-proposal.md). No deployment was included in that approval.

## Owner-approved urgency update (September 17, 2026)

Verified, policy-eligible hidden-link findings now carry `high`, the highest canonical
finding severity, from normalized concern through unified projection. The report
preserves the evidence assessment as a review concern, displays “High priority,”
and places these findings first. This does not assert compromise or change privacy
scoring, evidence thresholds, capture, or recurring cost. Historical projections
without severity remain readable without inventing an upgrade. The overview uses
compact count boxes; counting basis remains available in the hidden-link count
tooltip and the finding description.


## Owner-approved scoring update (September 17, 2026)

The subsequent v3 policy supersedes the score-neutral v1/v2 policy and applies
`min(40, 10 + 5 × (n − 1))` for positive verified occurrence counts; zero links
produce zero deduction. Policy effects retain scan/page/link identities and source
hash references. Full-site scoring unions those already-projected identities and
applies the cap once; no display-derived deduction is permitted. Repeated page
projections count once, while separate links on separate pages remain separate
occurrences. Bounded or partial captures score only their retained verified links.
The approved local report is rematerialized from retained canonical evidence;
other historical homepage records are not bulk rewritten. See
[canonical scoring policy](../scoring-policy.md) for the reference sheet and cost.
