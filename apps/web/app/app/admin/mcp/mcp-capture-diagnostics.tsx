import React from "react";

export function McpCaptureDiagnostics() {
  return <details className="rounded-lg border border-slate-200 p-3 text-xs">
    <summary className="cursor-pointer font-semibold">Requests before tool execution and capture health</summary>
    <p className="mt-2">This table contains retained tool events. OAuth rejection can happen before a tool starts. Missing completion or ingestion records are unknown, not successful delivery. A generated response does not prove the client received or used it.</p>
    <p className="mt-2">Run these queries in the MCP service’s existing CloudWatch log group, using the same time window. Log results do not inherit this table’s external-traffic filter. No log query runs automatically.</p>
    <h3 className="mt-3 font-semibold">Authentication failures before execution</h3>
    <pre className="overflow-auto whitespace-pre-wrap">{`fields @timestamp, event, reason, httpStatus, requestId, route, rpcMethod, bindingMismatch
| filter event = "mcp_http.auth_failed" or (event = "mcp_http.microsoft_auth" and outcome = "rejected")
| sort @timestamp desc
| limit 100`}</pre>
    <h3 className="mt-3 font-semibold">Tool starts without confirmed telemetry ingestion</h3>
    <pre className="overflow-auto whitespace-pre-wrap">{`fields event, requestId, eventId
| filter event in ["mcp.request_started", "mcp.telemetry_delivery", "mcp.telemetry_write_failed"] and ispresent(requestId)
| stats max(if(event = "mcp.request_started", 1, 0)) as started, max(if(event = "mcp.telemetry_delivery", 1, 0)) as accepted, max(if(event = "mcp.telemetry_write_failed", 1, 0)) as failed by requestId
| filter started = 1 and accepted = 0
| limit 100`}</pre>
    <p className="mt-2">Allow for in-flight calls and ingestion delay; include events on both sides of the time boundary. “Accepted” refers to telemetry ingestion, not client receipt. Historical auth failures may lack correlation fields. Use the Response capture filter to find retained rows with missing summaries.</p>
  </details>;
}
