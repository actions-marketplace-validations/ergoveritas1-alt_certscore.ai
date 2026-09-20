# Admin activity journeys and audiences

The ingestion projection was deployed with migration 0200. Visibility is a separate read policy.

Migration 0200 adds ingestion-time `activity_traffic` v1 to product events,
MCP activation/invocation events, scan requests, Pulse requests and scans.
Classification retains `class` and `basis`: owned daemon credentials, staff,
canaries, registered QA network, detected bots, authenticated nonstaff owners,
verified provider networks, or unknown. Arbitrary client names and “probe”
substrings are never ownership evidence. Historical records stay unknown;
changing a registry later does not rewrite retained classifications.

Authenticated activation retains the account reference and its existing opaque
MCP session. Its account-linked product event stores that opaque ID separately
from browser UUIDs. Admin Events can therefore identify MCP lifecycle events
and correlate them with tool calls without recording raw sessions or chats.
Unlinked/legacy events remain explicitly unlinked.

The default Admin Events, MCP and Scans view excludes known internal/QA and
automation activity while retaining unknown and historical records. It uses
one shared exclusion predicate plus the existing ownership/canary exclusions;
tables, summaries, charts, discovery and funnel queries share that policy.
The legacy `traffic=external` URL remains accepted but is labelled "Exclude
known internal / QA"; visibility does not assert verified external ownership.
Include all traffic also exposes internal activity. No guessed backfill or
change to retained classifications is authorized.

Discovery diagnoses missing linkage separately from discovery-only activity.
The mocked authenticated Claude protocol regression covers listing, executing
a tool, forwarding its resolved credential and emitting correlated telemetry;
it does not prove any particular production client made a tool call. Invalid
requests and unknown-tool/ID probes are counted separately from execution
errors and rate limits, without inferring ownership or malicious intent.

The session funnel separates connected account counts from caller bindings and
session counts. Its per-scan delivery cohort includes admissions in the selected
period and uses the same scan/session/client/provider/entrypoint. A full 10/30/60
minute window starts at completion, or admission for an already-completed reused
scan. Pending and failed scans cannot reduce completion-to-retrieval rates.
At most 5,000 admitted scan/session groups are measured and 25 missing retrievals
listed; sampling is disclosed. Retrieval means a successful generated result,
not proven client receipt, satisfaction or abandonment. Same-window scan-status
polls do not count as result retrieval.

## Rollout

Apply migrations before deploying readers/writers; preserve existing 0199
expanded-input rollout gating. No scans, model calls or prompt retention are
added. Metadata estimate: under $1/month at 100,000 new events/month, 90-day
retention, roughly 100 additional bytes per row (~30 MB steady-state raw
payload, plus database overhead). Re-estimate at materially higher volume.
Existing cached queries retain their 30-second cache and bounded result sizes.
Validate using local temporary-table fixtures and rollback; do not apply this
migration to production without a deployment request.
