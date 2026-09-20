# Product analytics

CertScore uses first-party analytics to understand product usage and improve reliability. Users can opt out at any time.

We record limited structured events such as pages, actions, forms, scans, reports, performance, and errors. Events may include normalized routes, coarse technical context, opaque session/actor IDs, and a canonical scan ID.

Scan evidence stays in the canonical scan system. We do not record passwords, tokens, keystrokes, form contents, arbitrary page text, payment information, precise persistent location, raw IP addresses, or session replay recordings.

Opting out stops linkable journey events and clears browser analytics identifiers. Essential security, service, scan, API, MCP, and reliability telemetry may continue. Optional Google analytics requires approval.

Raw events target 90-day retention. The admin dashboard is `/app/admin/analytics`; it shows activity, sessions, actors, routes, features, outcomes, and recent events. It does not measure off-site impressions or searches that never reach CertScore.

## SEO acquisition reporting (September 14, 2026)

Google collection is restricted to production builds on `certscore.ai` or `www.certscore.ai` and still requires analytics consent. The tag ignores referral attribution only when the parsed referrer hostname is exactly `accounts.google.com`; ordinary Google Search and other referral sources remain eligible. This affects future attribution and does not rewrite historic sessions.

For acquisition, use landing-page paths and source/medium rather than the generic page title. Exclude app/admin, auth, preview/report, and other product-result routes from a *marketing page* comparison; do not remove the later scan-completion events from a session-level conversion analysis. A customer visiting the app is not automatically internal staff. First-party Admin Analytics already distinguishes external/staff traffic and remains the product-outcome reference for that segmentation.

In GA4, `scan_completed` is an outcome key event. `scan_started`, `contact_clicked`, and generic `form_submit` remain diagnostic events but are no longer key events. Existing purchase and qualified/converted-lead definitions remain intact. `registration_completed` and `first_scan_completed` have source instrumentation but were absent from the property's last 28 days of received events on September 14; do not report them as verified live conversions. The browser campaign domain ordinal is not a lifetime account-wide activation count, and the visible registration marker path is password-specific. Validate an authorized real signup/completion before using those events as a universal account funnel. Do not manufacture conversions to populate GA.

The property has an Internal Traffic exclusion filter in Testing mode. Keep it in Testing until its matches are verified against known staff activity; do not guess an IP range or activate a permanent exclusion based on geography. Production-only tag guards prevent local testing from loading GA independently of that filter.

Use Search Console for search impressions and clicks, with matching complete date windows. Keep a fixed set of query/page groups for before/after comparison. Record deployment date and the GA configuration change date separately; aggregate key-event counts across the configuration change are not directly comparable.

The live Google tag also has a saved unwanted-referral condition: **Referral domain exactly matches `accounts.google.com`**, verified by reopening the editor. This matches the repository bootstrap behavior. The GA key-event changes above were saved and verified in the live property; website source changes require the normal AWS web release.

The saved GA comparison **Organic search — guide landings** selects `Session default channel group exactly matches Organic Search` AND `Landing page + query string contains /guides/`. It retains downstream session activity. It is specifically a guide comparison, not a verified external-only or whole-site marketing cohort. Apply it to acquisition and outcome reports; use first-party staff segmentation separately.

### Post-release comparison record

Record the web release SHA/date and Search Console's recrawl dates before selecting the first complete 28-day post-change window. Compare it with the preceding complete 28 days using identical country/device/search-type filters. Retain query-level rows, including zero-click rows, for the fixed query groups `gdpr compliance checker`, `gdpr scanner`, `gdpr website scanner`, `bulk website scanner for gdpr`, and the observed cookie/Reject queries. For the consolidated guide, sum the old three URLs and the destination in the baseline so a URL migration is not mistaken for growth.

| Cohort | Baseline window | Post-change window | Impressions / clicks / CTR / position | Completed scans | Verified external registrations / first scans |
| --- | --- | --- | --- | --- | --- |
| GDPR scanner solution and fixed GDPR query group | Pending export | Pending recrawl + 28 days | Pending | Pending | Unverified until funnel validation |
| Cookie consent scanner solution | Pending export | Pending recrawl + 28 days | Pending | Pending | Unverified until funnel validation |
| Consolidated pre-consent guide family | Pending export | Pending recrawl + 28 days | Pending | Pending | Unverified until funnel validation |
| Reject walkthrough and audit checklist | Pending export | Pending recrawl + 28 days | Pending | Pending | Unverified until funnel validation |

Use the dated audit in `outputs/seo-audit-2026-09-14/seo-audit.md` as the initial snapshot, not a substitute for matching exports. Keep missing conversion data as unavailable rather than zero. Report totals and per-query changes together; changing query mix, seasonality and consent coverage prevent a clean causal claim from a simple before/after comparison.
