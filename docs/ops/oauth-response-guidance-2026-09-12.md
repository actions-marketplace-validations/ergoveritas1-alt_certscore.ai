# MCP response guidance — local verification

All 12 tools now include versioned `ai.certscore/responseGuidance` result metadata and a separate agent-readable TextContent summary. Existing structured success payloads and original evidence text remain intact. Errors retain their existing isError/TextContent contract.

Guidance includes retained scan identity, status, score, risk and coverage when present; retained completion time and computed age; persisted region; read-versus-create provenance; returned finding IDs and inventory counts; evidence limits; pagination continuation; and a concrete next tool with arguments where supported. Missing metadata is explicitly null. No additional origin requests, scans, quota queries, or inference from raw evidence are introduced. Unknown quota consumption stays unknown.

Status guides agents to wait and poll or fetch the completed bundle. Terminal failures and no-go outcomes stop polling. Domain lookups explicitly identify retained results. Finding explanations distinguish the returned observation, interpretation, and reviewer action, without generating new findings. List responses provide next offset or page completion. Exports add a version, export timestamp, returned finding count, and scope of completeness. Existing bounded report, bundle, evidence and inventory text is preserved. Obsolete staff-scope-grant wording was removed from the optional Light follow-up.

Validation:
- 124 MCP tests, including preservation of response contracts, pagination, unknown/future timestamps, terminal outcomes and bounded explanation text.
- MCP TypeScript build.
- All 12 tools over real localhost authenticated OAuth, each checked against its declared output schema and new guidance metadata; same-session token refresh followed by status and bundle passed.
- Used retained canary 4bb8f7a1-bd70-492c-a520-bf6979cfcff6. Create reused it; no new scan.

No deployment or publication. No incremental infrastructure or scan cost; additional bounded response metadata adds a small response-size overhead. Quota consumption is not available from these API responses and is not fabricated. This verifies representative local calls, not production or every lifecycle/argument combination.
