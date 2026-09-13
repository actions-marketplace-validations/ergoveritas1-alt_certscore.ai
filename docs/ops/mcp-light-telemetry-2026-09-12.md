# Light telemetry improvements

Implemented locally; deployment remains on hold.

1. Initial Light scan responses retain queued/preview/completed/failed classification, bounded preview wait and internal read count in the invocation summary. Existing scans/results and preview behavior are unchanged.
2. Workflows calculate early caller polls, measurable polling pairs, calls after observed completion, internal preview reads, time to first preview/completed response, and completed bundle response time. Calculations stay inside the existing session/scan/client/surface groups and bounded cohort. Missing timestamps remain unknown; overlapping calls are not labeled early relative to guidance that had not yet been generated. These measure response generation, not receipt or satisfaction.
3. A server-generated request ID flows through Light transport logs, invocation starts, invocation events and rate-limit events. IDs are request-local via AsyncLocalStorage, never taken from caller-supplied headers. Early transport failures get correlation IDs too.
4. Events mark whether the request IP differs from session initialization when both are known. The initialized caller identity is preserved. Request details explain provider IP sharing and the distinction between stable session attribution and per-call requester IP. Unknown IPs remain unknown.
5. Summaries retain explicit anonymous creation limit/remaining/reset time separately from existing weighted read-rate-limit detail. Explicit error scanStarted/quotaConsumed are preserved. Missing values are not interpreted as permission or consumption.
6. Summaries retain returned/total finding and inventory counts, bounded omitted-section names and an omission reason when supplied. Missing counts are not inferred from a truncated sample. Details display this information without storing full responses.

No migration, recurring collector, new capacity, expanded retention, scan or model call. Existing 2 KB summary and 4 KB request-details limits remain enforced. Estimated added storage/log cost below $1/month at 100,000 calls, disclosed before implementation.

Verification: 138 MCP tests, 40 HTTP tests and 15 focused Admin/shared tests pass. Shared/MCP builds and web/HTTP type checks pass. Tests cover preview/quota/completeness capture, changed requester attribution, early transport IDs, overlapping polling and historical missing timing.

Deploy the web/shared telemetry receiver before the MCP emitter when deployment is authorized. Existing production and historical events have not been modified. Metrics summarize observed calls; they do not establish unique agents, client receipt or abandonment.
