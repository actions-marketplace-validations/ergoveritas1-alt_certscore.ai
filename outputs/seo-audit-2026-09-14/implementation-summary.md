# SEO implementation — September 14, 2026

## Website changes

- GDPR and cookie-consent solution pages reuse the existing preview scan form directly, with a report walkthrough, coverage limits, implementation handoff, and links to the sample report and practical guides.
- The GDPR product title targets website scanner intent. `/gdpr` now has a distinct evidence/methodology title, heading, description and product link; navigation labels reflect its educational purpose.
- Three overlapping pre-consent guides permanently redirect to `/guides/detect-tracking-before-consent`. The surviving guide explains reproducible context, requests versus storage, evidence records, remediation and retesting. Internal links and sitemap entries point to it.
- Reject testing and consent audit checklist pages now provide practical review steps, with a reusable Markdown worksheet and links to the documented product method. The three practical guides omit the generic illustrative JSON/atlas block so the walkthrough stays focused.
- Removed four pre-existing redirecting sitemap entries. Added the extension privacy canonical and removed repeated brand suffixes from it and the regulatory hub.
- Google Analytics bootstrapping is restricted to production on the two public hostnames; consent remains required. Exact Google OAuth referrers are ignored for attribution, while normal search and referrals remain intact.

## Live GA4 configuration

- Saved and reopened an unwanted-referral rule matching `accounts.google.com` exactly.
- Saved and verified the comparison `Organic search — guide landings`, filtering Organic Search sessions by a `/guides/` landing page while preserving downstream session activity. The analytics documentation includes the fixed-cohort post-recrawl comparison record; future performance results require a complete post-release window.
- Unmarked `form_submit`, `scan_started`, and `contact_clicked` as key events; they remain ordinary diagnostic events. `scan_completed` remains a key event. Existing purchase and qualified/converted-lead definitions are preserved.
- Verified that the Internal Traffic exclusion filter is in Testing mode. No unknown IP ranges were added and no unverified permanent exclusion was activated.
- Verified recent event names. `registration_completed` and `first_scan_completed` are implemented in source but were not received in the last 28 days. No synthetic conversions were created. Documentation records the password-marker and browser-ordinal limitations so they are not represented as verified universal activation measures.

## Independent distribution

Prepared `docs/gtm/seo-evidence-resource-distribution.md`: agency email, developer community post, and product social drafts with campaign links and intended channels. No messages were sent; recipients/publication require explicit authorization. New independent links depend on third parties and cannot be guaranteed. The resource uses documented product methodology and a blank worksheet rather than fabricated benchmark data or case studies.

## Validation

- 14 analytics tests passed, including runtime execution of generated bootstrap code for consent, production host restrictions, idempotence, and exact OAuth referral handling.
- Web typecheck passed.
- Final repository fast preflight passed across its change-selected checks.
- Local browser preview verified the GDPR scan form, enabled submission for a valid URL without submitting a scan, desktop layout, and the Reject walkthrough.
- Local HTTP checks verified three permanent 308 guide redirects, worksheet 200, sitemap 200 without removed entries, and metadata page availability.

No new scan runs, model calls, paid tools or infrastructure were added. Additional static resource storage is estimated below $0.01/month; no per-scan cost change. GA configuration applies prospectively and does not repair historical attribution.

Website revision `ae7900c52466ce6a1678276995a9c5a64e857610` was deployed through AWS ECS on September 14, 2026 (Pacific time). Workflow 34910702095, ECS stabilization and live deployment checks passed. See `outputs/seo-release-2026-09-14/` for release verification. Post-recrawl ranking/conversion changes cannot yet be measured; the report template deliberately leaves those values pending.
