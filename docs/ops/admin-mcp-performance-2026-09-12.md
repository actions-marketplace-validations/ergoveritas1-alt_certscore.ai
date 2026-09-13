# Admin MCP performance changes — September 12, 2026

Status: implemented and verified locally. **Do not deploy without the owner's subsequent instruction.**

## Changes

- Render the traffic selector and three navigation links before awaiting telemetry. Links show a pending indicator; independent panels stream loading states and have error boundaries with a retry control.
- Load Usage snapshot and request ledger independently. Keep supplementary analytics collapsed; load the workflow session funnel only after the user selects Show.
- Resolve linked-scan internal/QA and Mac mini classifications once per 30-second cache window. Preserve the existing identity, client-name, IP and canary predicates. Authorization runs before accessing cached admin results.
- Materialize the filtered, ordered activity page before enriching it from scan snapshots, pages and requester records. UUID joins no longer cast indexed request scan IDs to text. Requester provenance remains available even without a canonical scan row.
- Fetch caller history and prior-call context only on request. Reauthorize each action and derive correlation anchors from the retained event under the selected traffic scope. Preserve PostgreSQL timestamp precision so the current request is included in its own counts.
- Cache Discovery groups independently of pagination. Cache workflow cohorts independently of pagination/search/purpose, then paginate complete groups. Retain at most 5,000 calls and a bounded serialized cohort, with explicit sample labeling and guidance to narrow filters. Never cut through a workflow group; completeness applies only inside the selected time window.
- Reduce Discovery/workflow table minimum widths, wrap the navigation, and collapse diagnostic sections.

## Verification

- Web TypeScript check passed: `pnpm exec tsc --noEmit -p apps/web/tsconfig.json`.
- 33 targeted tests passed, zero failures/skips. Includes PostgreSQL Discovery aggregation, traffic classification, whole-workflow budget boundaries, session funnel, caller time windows (including microseconds), prior-context identity/visibility isolation, response details, and admin rendering contracts.
- Local browser checks used 21 temporary invocation fixtures: Usage → Discovery → Workflows navigation; page two in Discovery and Workflows; Discovery search resets pagination; workflow-to-Usage drill-down; optional session funnel; caller counts of exactly one in every window; prior-context lookup with an honest missing-context state.
- Changing one local fixture to canary traffic excluded it from the external view on the next action refresh. No hidden event context was returned.
- No browser errors were observed in the successful flows. During development a stale hot-reload stream required a reload; fresh loads completed normally.
- All 21 browser fixtures and the disposable context-test database were removed afterward. SQL test fixtures otherwise use temporary tables/rolled-back transactions.

## Limits and cost

Production latency targets are not yet verified. Local development timings are not production benchmarks; measure cold and warm 30-day views after a separately authorized AWS release. Existing database capacity, retention, and deployment configuration are unchanged. Added bounded timing logs are estimated below $0.10/month at 50,000 admin page views; no new infrastructure or paid service is introduced.

The workflow list explicitly reports when its call/payload budget omits groups. Use a narrower client/time window to inspect omitted history. Usage snapshot analytics still share one cached dashboard load, but no longer block the request ledger or navigation. Panel Retry reloads the page, preserving its query parameters.
