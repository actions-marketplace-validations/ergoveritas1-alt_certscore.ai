# Expanded MCP caller input (local implementation)

`MCP_EXPANDED_CALLER_INPUT_ENABLED=1` enables version 2 capture in the MCP
service, including pre-execution HTTP rejection telemetry. It is **off by
default**. No database migration or deployment is performed by this change.

Version 2 retains safe submitted text up to 8,192 characters per value, up to
128 fields and eight nesting levels, within a 12 KiB caller-input and 16 KiB
whole-request envelope. Prompt/context fields are visited first. Explicitly
shared question text is prioritized over other captured fields. Oversized
values, field/depth limits and byte limits have omission markers; secrets,
contact data and conversation/history fields remain filtered. The admin view
shows every retained value and an expandable path-indexed JSON representation,
not a reconstructed raw payload. Original chat text is unavailable unless the
caller explicitly sends supported context; sharing permission remains required
for `taskContext.questionSummary`. Historical truncation cannot be recovered.

## Rollout prerequisites (not authorized by implementation)

1. Obtain storage-cost approval before enabling expanded production capture.
2. Apply migration `0199_mcp_expanded_request_details.sql` and deploy the
   version-aware readers/ingestion before enabling the MCP producer flag.
3. Verify new records, redactions, omission markers and admin rendering.

Retention remains 90 days. Default-off operation has no incremental storage or
model cost. At 100,000 requests/month, the additional 12 KiB ceiling represents
up to approximately 3.7 GB of retained payload after 90 days, before database,
backup and replication overhead. Actual spend depends on measured traffic,
payloads and AWS database configuration; do not assume it is below $1/month.
Lower-cost alternative: leave legacy capture enabled and use the new admin
JSON view with existing retained input. Disable the flag to roll back capture;
keep version-2 readers and the expanded constraint for existing records.
