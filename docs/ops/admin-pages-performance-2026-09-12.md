# Admin Overview, Users, and Scans performance — September 12, 2026

Implemented and verified locally. **Not deployed**, per the owner's current instruction.

## Production baseline

Read-only CloudWatch inspection of `/ecs/certscore-web/certscore` in us-west-1, last 24 hours, query `964c0ddd-eb00-42ca-a3eb-3880ae18da68`:

- Overview loader: 11,827 ms.
- Users list: 4,627–6,303 ms; workspace options: 403–1,397 ms.
- Scans list: up to 18,875 ms in the sampled records. Its activity-page query took 12,077 ms, row enrichment 5,281 ms, and score attribution 731 ms in that run.
- Scan filter options: 2,541–2,608 ms; snapshot: 2,098–2,192 ms.

These are sampled server timings, not browser percentiles or a complete traffic cohort.

## Changes

- Disable expensive admin-navigation prefetches that can compete with the selected page.
- Stream Overview cards independently with loading and error boundaries. Limit recent users/scans before their enrichment joins; omit MCP enrichment that Overview does not display.
- Replace Users' repeated per-user scan/request-history queries with grouped aggregates. Preserve sorting over the entire result before pagination, and avoid double counting self-claimed scans. Load the activation funnel independently in a collapsed section; it is not fetched on demand.
- Stream the Scans snapshot and table independently. Reuse one 30-second cached scan traffic classification across the default activity query, physical-scan overview counts, and operational snapshot. Preserve request-level traffic predicates and bot precedence.
- Remove scan-request table/index creation from admin repository reads. The existing checked-in migration owns this schema; writer initialization is unchanged.
- Add bounded Overview loader timings for future production comparison.

Authentication gates, customer scan behavior, findings, scoring, and production infrastructure are unchanged. Cached traffic classification may lag new classifications by 30 seconds; cache failures throw rather than treating exclusions as empty.

## Verification

- 61 focused tests passed, including PostgreSQL temporary-table tests for all seven Users sort keys in both directions, pagination, associated scan counts, and canary/QA/bot traffic classification.
- Web TypeScript check passed; `git diff --check` passed.
- Local browser: Overview cards rendered, Users rows and Activity ascending sort worked, Scans snapshot/table rendered, pagination reached page two, and switching between all/external traffic updated the snapshot and completed the independent table load. No browser console errors were captured in the final Scans check.
- Controlled PostgreSQL benchmark using disposable temporary tables: 503 users, 20,123 scans, and 20,121 request rows. Users SQL execution fell from **1,395.305 ms to 11.196 ms**; local buffer hits fell from 305,833 to 806. This measures the SQL on a local fixture, not production page latency.

Focused command:

```sh
ADMIN_PERFORMANCE_TEST_DATABASE_URL=postgresql://localhost/certscore pnpm exec tsx --tsconfig apps/web/tsconfig.test.json --test apps/web/server/admin/admin-pages-performance.test.ts apps/web/server/admin/admin-canary-traffic-filter.test.ts apps/web/server/admin/admin-scan-summary.test.ts apps/web/server/admin/admin-scan-operational-snapshot.test.ts
pnpm exec tsc --noEmit -p apps/web/tsconfig.json
```

No persistent benchmark data, capacity increase, new service, paid model call, or retention extension was added. Incremental bounded timing-log cost is estimated below $0.10/month at 50,000 admin views, within the pre-approved below-$1 threshold; query work should decrease.

Actual production improvements still require an authorized AWS deployment and a comparable post-deployment timing sample. Existing MCP performance and token-refresh changes in this worktree were preserved separately.
