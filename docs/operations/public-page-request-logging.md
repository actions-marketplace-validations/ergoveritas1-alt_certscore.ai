# Public page request logging

Public HTML GET document requests now enter Admin Events independently of browser
JavaScript and analytics consent. Existing scan lifecycle and interaction logging
remain in place. This is request evidence, not proof that a human saw a page.

## Capture and correlation

- Node middleware runs before Next's cached page rendering. It records a
  `page_requested` event asynchronously through the existing database pool.
- Each request gets a random UUID and a timestamp. A domain-separated HMAC using
  the existing `BETTER_AUTH_SECRET` binds them to the normalized path. The signed
  proof expires after 24 hours and is carried in the response's `Server-Timing`
  header, not cached HTML, a cookie, local storage, or a visitor identifier.
- Public document responses use `Cache-Control: private, no-store, max-age=0` to
  prevent downstream caches from replaying proof. Next's internal cached HTML is
  preserved. A production-build fixture verified `x-nextjs-cache: HIT` with a
  distinct proof on each response, including when route headers otherwise request
  public caching.
- The initial browser view submits that proof. Both writers use one idempotent
  upsert: server-first, browser-first, retries and delayed background writes all
  leave one row. Browser confirmation may recover a failed server insert because
  its verified proof establishes the original request. No heuristic matching is
  used. Unverified payloads cannot create server-request provenance.
- Subsequent client-side navigation uses existing browser tracking. BFCache
  restores emit a separate browser view and never reuse the document's proof.
- Assets, API/MCP transport requests, health endpoints outside document routes,
  RSC fetches, and recognized prefetch/prerender requests are excluded. Public
  `/mcp/light` HTML remains eligible. Bot classification uses a bounded existing
  user-agent heuristic; it is not a guarantee that every bot is identified.

## Admin Events and privacy

`Page requested` rows show `Not browser-confirmed` or `Browser-confirmed view`.
The Public page requests metric counts both states. The Page views metric and
filter include confirmed requests plus existing page/scan/report views. These
metrics overlap and must not be added together as distinct visits.

When navigation response metadata is unavailable, the browser emits an anonymous
`Browser view · request not linked` event. That view remains visible but cannot
be paired reliably with a server row; the UI must not imply exact deduplication
in this case. Missing browser confirmation never means the page was unseen.

New request and initial confirmation records retain no actor, session, account,
organization, scan identity, raw IP, campaign, referrer, or query-string values.
They use normalized paths and the existing 90-day raw-event retention target.
Existing optional analytics and other interaction tracking are separate and
unchanged. This feature does not add a third-party script or browser cookie.

## Failure boundaries

Persistence is best-effort and does not block serving the page. Failures emit
`public_page_request.write_failed`, `public_page_confirmation.write_failed`, or
`public_page_request.configuration_failed` operational logs. A failed request
write with no delivered browser confirmation can still be lost from Admin Events.
Response status is not claimed: middleware records the request before rendering.
Redirects/rejections handled before middleware and requests served by any future
upstream cache require separate coverage; AWS ALB logs remain a diagnostic
source and are not imported into Admin Events by this change.

Set `CERTSCORE_PUBLIC_PAGE_REQUEST_LOGGING_ENABLED=0` to stop new middleware
capture. Existing browser tracking continues, with initial views unlinked. Apply
migration `0201_public_page_requests.sql` before promoting the web image through
the repository's AWS deployment workflow. No production migration or deployment
was performed during implementation.

## Cost estimate, September 14, 2026

Read-only AWS checks found ALB access logging already enabled, 217,237 total
requests over September 7–14, a 20 GiB gp3 database with approximately 5.54 GB free,
and 4.75% average database CPU on September 13. A spread sample of 12 of 653 ALB
log objects contained 425 requests, 21 of which were public-document candidates.
This suggests approximately 46,000 candidates/month, with substantial sampling
uncertainty. At a conservative 2 KiB/row including index overhead, 90 days of these
records would occupy roughly 0.3 GB before accounting for replacement of existing
browser rows. Existing retention pruning remains bounded, so monitor actual size.

Estimated incremental recurring cost is **$0–$0.50/month at the observed traffic**,
using existing provisioned ECS/RDS capacity, without new services, capacity, paid
APIs, model calls, or a raw-log ingestion pipeline. This includes allowance for
small compute/backup effects; it is not an AWS price quote. Reassess on material
traffic growth or capacity pressure. Changes estimated at $1/month or more still
require owner approval.

## Verification

- Focused Node tests cover request classification, consent-independent delivery,
  proof tampering/expiry, and unavailable browser correlation.
- A local PostgreSQL regression applies the actual migrations and tests both
  arrival orders, retries, mismatched routes, anonymous columns, bot metadata,
  and the actual shared Admin Events view-count predicate.
- A Next 15.5.23 production-build fixture uses the real middleware, tracker and
  ingestion handler against an isolated local database. Chromium verification
  covers untouched/granted/denied consent, no JavaScript, blocked ingestion,
  unique reload IDs, cached HTML, client navigation, retries and forged payloads.
  It also verifies unavailable response metadata, recovery from a failed server
  insert, and preservation of the authenticated app redirect.
- All 30 focused tests and the full web TypeScript check passed. The fixture's
  production build passed; this is not a full production-web build or deployment.

Run the deterministic and SQL tests with a **local-only** database:

```sh
PUBLIC_PAGE_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/postgres \
  node --import tsx --test apps/web/lib/product-analytics/*.test.ts \
  apps/web/server/product-analytics/public-page-sql.test.ts apps/web/middleware.test.ts
```

The SQL test uses transaction-local temporary tables and rolls back its changes.

## Release readiness follow-up

The production task definition inspected on September 14 already supplies
`BETTER_AUTH_SECRET` and `DATABASE_URL`. It has no public-page logging override;
the implementation defaults to enabled. No new secret or service is needed.
The AWS web workflow applies target-image migrations before ECS promotion and
checks the latest migration. The new deterministic logging tests now run in that
workflow before the image is built. A follow-up audit fixed the asset classifier
to include domain-bearing `/pulse/[domain]` pages (including domains such as
`example.zip`). The focused and migration-order suite passes all 36 tests.

Before releasing, commit the feature and pass the full web image build and the
workflow gates. After promotion, verify the served SHA, a fresh request proof and
no-store header, then reconcile the same request ID with its Admin Events row.
Check untouched/granted/denied consent, a JavaScript-disabled visit, confirmation
deduplication, and the failure logs. Include all traffic when checking automated
or internal visits. The earlier isolated fixture checks do not replace this live
deployment verification. Creating controlled production visits for this smoke
test should be included in the deployment authorization; no production scans are
needed.
