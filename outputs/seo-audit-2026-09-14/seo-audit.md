# CertScore SEO investigation — September 14, 2026

Read-only investigation of the authenticated Google Analytics and Search Console properties, the live public site, and WC01 source. No production configuration, content, infrastructure, or scan behavior changed. No scans or paid services started. Incremental recurring infrastructure cost: $0.

## Main conclusion

Search visibility exists, but rankings and clicks are weak. Prioritize stronger existing pages, clearer differentiation between overlapping pages, and relevant independent links. Clean analytics attribution so product use and OAuth returns do not masquerade as acquisition. Small technical SEO defects are real but do not explain the whole result.

## Observed search performance

Search Console's latest 28-day window was August 16–September 12, 2026: 3 clicks, approximately 1,390 impressions, 0.2% CTR, average position 59.2. The three-month window was June 13–September 12: 8 clicks, approximately 3,220 impressions, 0.2% CTR, average position 50.7. These overlapping windows are not a valid before/after comparison.

| Page | Clicks | Impressions | Average position |
| --- | ---: | ---: | ---: |
| Homepage | 2 | 83 | 12.7 |
| /solutions/cookie-consent-scanner | 1 | 50 | 46.2 |
| /solutions/gdpr-website-compliance-scanner | 0 | 507 | 67.0 |
| /gdpr | 0 | 313 | 63.3 |
| /guides/third-party-cookie-checker | 0 | 122 | 63.9 |
| /guides/cookie-consent-enforcement-checker | 0 | 104 | 69.3 |
| /solutions/privacy-policy-risk-scanner | 0 | 68 | 42.7 |
| /developers | 0 | 51 | 39.5 |
| /guides/detect-tracking-before-consent | 0 | 42 | 72.8 |
| /developers/sdk | 0 | 34 | 12.2 |

Queries include “gdpr compliance checker” (110 impressions, position 73.4), “gdpr scanner” (63, 63.4), “gdpr website scanner” (56, 33.9), and “bulk website scanner for gdpr” (40, 74.5). All four had zero clicks. These are observed impressions, not estimated total keyword demand. Low CTR at these positions is not evidence that titles alone are the problem.

Source: [Search Console performance](https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Acertscore.ai&num_of_days=28).

## Analytics findings

GA4, August 17–September 13: 114 sessions, 1,040 events, 107 key events. Channel sessions: Referral 79, Direct 33, Organic Search 2, AI Assistant 1. Do not interpret key events as 107 customers or sales; individual event definitions still need inspection.

GA4 Home, September 7–13: 9 active users, 25 channel sessions, 16 key events. All 13 referral sessions shown were accounts.google.com; 11 were Direct and 1 ChatGPT/AI Assistant. This strongly suggests OAuth return attribution contamination; it does not establish that every such session was an internal user.

The generic “CertScore.ai” page-title bucket includes app/admin pages: several live user tabs used exactly that title. Thus the email's 376 views from 8 users should not be treated as homepage acquisition. A path-level breakdown is still needed to quantify its composition.

Source confirms Google Analytics loads only after analytics consent. GA therefore does not count all visitors. Source also places the same Google tag in the root layout without a production-only guard; consented localhost use can send data unless property-level filtering prevents it. Umami has a production guard. Existing source already implements registration_completed, scan_started, scan_completed, first_scan_completed and other funnel events; verify their GA configuration instead of duplicating instrumentation.

Recommended measurement work: exclude OAuth referrals appropriately, validate internal/developer traffic filters in testing mode first, separate public acquisition from authenticated product activity, and report organic landing page → registration → first completed scan. Preserve consent gating. Compare matching date windows and use Search Console for impressions/clicks and first-party analytics for product outcomes.

Reference: [Google unwanted referral guidance](https://support.google.com/analytics/answer/10327750?hl=en).

## Crawl and indexing

Live sitemap crawl: 104 entries, all ultimately returned HTTP 200; all returned an H1. Four sitemap entries redirect: /contact, /guides/findings, /guides/disclosure-signals, /guides/privacy-policy-signals. Their destination URLs are already in the sitemap. Remove the redirecting entries while preserving redirects.

/browser-extension/privacy lacks an explicit canonical and repeats the brand suffix in its title. /regulatory also repeats the brand suffix. Fix these small metadata defects.

robots.txt permits public marketing crawling and advertises the sitemap. Public content is available in server-returned HTML. Existing canonical and structured-data infrastructure is extensive; it does not need to be rebuilt.

Search Console indexing report, labeled last updated September 3: 84 indexed and 148 not indexed. Reasons include 58 crawled/currently not indexed and 50 404s. Many excluded examples are deployment-versioned CSS, APIs, discovery files, and text resources. The first 10 404 examples were nine old CSS URLs and /path/to/CertScore.ai. This is not evidence of 50 broken marketing pages. Do not block current CSS/JS to make the report look cleaner.

Real crawled-but-not-indexed examples include /guides/reject-consent-tracking-test, /guides/website-consent-audit-checklist, /guides/website-consent-audit, /guides/pre-consent-tracking-detection, /guides/check-website-tracking-before-consent, and /compare/onetrust-runtime-consent-testing. This status alone does not prove low quality or duplication. Review important pages individually after improving them.

Search Console showed no Core Web Vitals field data. Findings pages have approximately 560–598 KB of uncompressed HTML in this crawl. That merits a measured payload/rendering review, but is not a demonstrated CWV failure. No Lighthouse or lab performance test was performed.

References: [Indexing](https://search.google.com/search-console/index?resource_id=sc-domain%3Acertscore.ai), [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Content and links

/gdpr and /solutions/gdpr-website-compliance-scanner both target the GDPR scanner audience. Their impressions do not prove cannibalization, but their overlapping purpose deserves review. Use the solution page as the commercial scanner destination and make /gdpr a clearly distinct evidence/methodology resource, or consolidate only after reviewing query-level overlap and preserving valuable content.

There are numerous pre-consent tracking guide variants. Some inspected pages offer short conceptual paragraphs rather than a complete practical procedure. Consolidate genuinely redundant material into a substantial guide with exact steps, retained examples, interpretation boundaries, fixes and retesting. Distinct Reject testing and audit-checklist pages can remain if they solve distinct tasks.

Strengthen the GDPR and cookie-consent solution pages with an evidence-backed walkthrough, sample results, what is and is not tested, and a shorter path to starting a scan. Their current primary CTA sends users back to the homepage. Suggested GDPR title: “GDPR Website Scanner: Cookies & Consent | CertScore.ai”. Validate the final title against page content. Keep risk-signal positioning and avoid promises of certification or complete legal compliance.

Google's Links report lists 250 external links from 10 sites; consentcheck.site supplies 233 (93.2%). Remaining sources include Cloudflare, ErgoVeritas, PulseMCP, npm, Indie Hackers, and several directories. This is a concentrated reported profile, not 250 independent endorsements; Search Console is not an exhaustive backlink census. No spam finding or disavow recommendation is justified by these counts.

Build reference-worthy material from verified existing evidence: a reproducible Reject test walkthrough, dated benchmark methodology with defensible denominators, or an agency implementation case study. Seek relevant independent citations and links when appropriate; avoid paid link packages. No outreach was sent. New scan campaigns would need separate cost review.

References: [Links report](https://search.google.com/search-console/links?resource_id=sc-domain%3Acertscore.ai), [Google helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

## Priority order

1. Clean attribution and verify existing activation events; fix sitemap redirect entries, canonical omission and duplicate brand suffixes.
2. Improve the GDPR scanner and cookie-consent scanner pages with concrete evidence and a direct scan journey. Clarify /gdpr's distinct purpose.
3. Consolidate truly overlapping pre-consent guides; strengthen the Reject test and audit checklist with useful original detail. Update internal links and retain appropriate permanent redirects for merged pages.
4. Develop one evidence-backed resource worthy of independent links; use verified existing evidence first.
5. After recrawl, compare consecutive 28-day windows for the same query/page groups: rankings, clicks, external organic registrations and first completed scans. Do not treat aggregate position changes caused by a different query mix as a clean experiment.

No production changes were made during this investigation. Raw live URL results are in live-sitemap-audit.json next to this report.
