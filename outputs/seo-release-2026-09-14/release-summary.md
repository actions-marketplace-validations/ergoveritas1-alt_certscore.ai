# SEO production release — September 14, 2026 (Pacific)

Deployed website revision `ae7900c52466ce6a1678276995a9c5a64e857610` to `certscore.ai` through the canonical AWS public web workflow. Release was a forward deployment from `e2adba01cfca0554d78f4d6a406ef004bb2afb28`, using a clean detached worktree at `/Users/benmasek/WC01-seo-release`. Unrelated working changes were preserved.

[Successful workflow](https://github.com/ergoveritas1-alt/certscore.ai/actions/runs/34910702095) completed in about 10 minutes. CI tests, web typecheck, production build, target-image migration step, ECS stabilization, live revision and deployment-path checks passed. The exact application source had already passed local fast preflight; the canonical invocation skipped only that duplicate local gate. Workflow checks remained enabled. The existing web workflow also promotes its companion materializer; no Lambda scanner or validation deployment was dispatched and no schema changes were included.

Live verification passed for 13 URLs: two solution pages with direct scan forms, GDPR evidence guide, three practical guides, two metadata pages, three 308 redirects, sitemap, and audit worksheet. Production browser interaction confirmed a valid URL enables the scan form; no scan was submitted. See `live-verification.json`, `live-version.json`, and `deploy.log`.

The live deployment audit emitted one expected warning: no secondary host is configured, so its secondary-host audit was skipped. The canonical public host audit passed. No infrastructure capacity or per-scan work changed. Static storage increase remains estimated below $0.01/month.

## Search submissions

The workflow submitted all 97 current sitemap URLs to IndexNow in one batch.

Google Search Console accepted each of these five URLs into its priority crawl queue after the release. Each displayed the `Indexing requested` confirmation:

- `/solutions/gdpr-website-compliance-scanner` — already indexed before request.
- `/solutions/cookie-consent-scanner` — already indexed before request.
- `/guides/detect-tracking-before-consent` — already indexed before request.
- `/guides/reject-consent-tracking-test` — crawled, currently not indexed before request; last crawl displayed July 2, 2026.
- `/guides/website-consent-audit-checklist` — crawled, currently not indexed before request.

Queue acceptance does not establish indexing, a completed recrawl, or ranking improvement. No repeated requests were made for the same URL.

## Remaining measurement and distribution

GA attribution, key-event changes and organic-guide comparison were saved in the implementation turn. Signup-to-first-scan measurement still requires validation with an authorized real user journey; this release verification did not create users or scans. The current source's registration marker is password-specific and its first-scan marker uses a browser domain ordinal, so neither is represented as a verified universal account activation metric.

Outreach drafts remain unsent; no recipients were authorized. The fixed-cohort 28-day comparison template is in `docs/product-analytics.md`; post-release results remain pending actual recrawl and a full observation window.
