import { McpContextOnDemand } from "./mcp-context-on-demand";
import Link from "next/link";
import { McpDetailsPopup } from "./mcp-details-popup";
import React from "react";
import { mcpRequestDetailsSchema } from "@website-signal-risk-scanner/shared";
import type { AdminMcpTelemetryEvent } from "../../../../server/admin/mcp-telemetry";

export function McpRequestDetails({ event, traffic, period }: {
  event: Pick<AdminMcpTelemetryEvent, "related_context" | "request_details" | "session_id" | "actor_id" | "tool_name" | "requested_resource" | "requested_resource_type" | "quota_outcome" | "transport_outcome"> & Partial<Pick<AdminMcpTelemetryEvent, "request_id" | "event_id">>;
  traffic: string; period: string;
}) {
  const parsed = mcpRequestDetailsSchema.safeParse(event.request_details);
  const details = parsed.success ? parsed.data : null;
  const questionStates = {
    not_provided: "The caller did not include a shared question in this call.",
    sharing_not_confirmed: "Question text was omitted because sharing was not confirmed.",
    invalid_context: "Task context was supplied but did not match the supported format.",
    filtered: "Question text was omitted by the sensitive-content filter.",
    omitted_by_limit: "Question text exceeded the retention budget and was not retained.",
    retained: "Shared question retained below.",
  };
  const href = (id: string) => `/app/admin/mcp?${new URLSearchParams({ q: id, traffic, timeSpan: period })}`;
  const actorBasis = details?.actorBasis === "authenticated" ? "Authenticated caller"
    : details?.actorBasis === "provider_ephemeral" ? "Provider-declared opaque caller"
    : details?.actorBasis === "requester_binding" ? "Requester binding (may represent shared IP)"
    : "Correlation basis not recorded";
  return <McpDetailsPopup title="Request details" trigger="Request details">
      <section aria-label="Shared question" className="rounded-lg border border-sky-200 bg-sky-50 p-3">
        <h3 className="font-semibold text-slate-950">Shared question</h3>
        {details?.taskContext?.questionSummary ? <>
          <p className="mt-1 text-xs text-slate-500">{details.taskContext.questionSource === "user_wording" ? "Shared user wording" : "Agent paraphrase"} · explicitly shared by the client · {details.version === 2 ? "up to 8,192 characters within the request budget" : "up to 300 characters"}</p>
          <p className="mt-2 whitespace-pre-wrap">{details.taskContext.questionSummary}</p>
        </> : <p className="mt-2">{details?.callerInput ? questionStates[details.callerInput.questionStatus] : "No question text retained. Older records do not distinguish omitted, filtered, and unrecorded text."} Additional text explicitly sent in tool arguments appears under “What the caller sent.” The original chat conversation is not automatically sent.</p>}
      </section>
      {event.related_context ? <section className="rounded-lg border border-slate-200 p-3">
        <h3 className="font-semibold">Context from an earlier call</h3>
        <p className="mt-1 text-xs text-slate-500">Same caller, session, scan and entrypoint; this text was not supplied with the current call. {event.related_context.taskContext.questionSource === "user_wording" ? "Shared user wording" : "Agent paraphrase"}.</p>
        <p className="mt-2 whitespace-pre-wrap">{event.related_context.taskContext.questionSummary}</p>
        <Link className="mt-2 block text-xs text-sky-700 underline" href={`/app/admin/mcp?${new URLSearchParams({ q: event.related_context.eventId, traffic, timeSpan: "all" })}`} prefetch={false}>Source request · {event.related_context.occurredAt}</Link>
      </section> : null}
      {!event.related_context && event.event_id ? <McpContextOnDemand eventId={event.event_id} traffic={traffic} kind="related" /> : null}
      <section aria-label="What the caller sent">
        <h3 className="font-semibold text-slate-950">What the caller sent</h3>
        <p className="mt-1 text-xs text-slate-500">All retained submitted arguments and metadata are shown below, including supplied prompt text. Secrets and sensitive data remain redacted. These are caller-supplied values, not verified claims or necessarily the user’s wording. Initialization metadata is labelled separately. This is not the original chat conversation or an unredacted request payload.</p>
        {details?.callerInput ? <>
          <dl className="mt-3 space-y-3">{details.callerInput.fields.map((field, index) => <div key={`${field.path}:${index}`}>
            <dt className="break-all font-mono text-xs font-semibold">{field.path}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-all">{field.value === undefined ? "Value not retained" : String(field.value)}</dd>
            <dd className="text-xs text-slate-500">{field.type} · {field.disposition}{field.reason ? ` · ${field.reason.replaceAll("_", " ")}` : ""}</dd>
          </div>)}</dl>
          {details.callerInput.limits.length ? <p className="mt-2 text-amber-800">Additional input omitted: {details.callerInput.limits.map(limit => limit.replaceAll("_", " ")).join(", ")}.</p> : null}
          <p className="mt-2 text-xs text-slate-500">{details.callerInput.version === 2 ? "Expanded capture: up to 128 fields, 8 nesting levels and 8,192 characters per text value, within a 12 KB input / 16 KB request budget. Values exceeding safety limits are explicitly omitted." : "Legacy capture: maximum 24 fields and 4 KB; previews up to 300 characters. Longer text cannot be recovered from this record."} Sensitive fields may be omitted.</p>
          <details className="mt-3 rounded-lg border border-slate-200 p-3">
            <summary className="cursor-pointer font-semibold">Full retained caller input (JSON)</summary>
            <p className="mt-2 text-xs text-slate-500">Path-indexed captured fields with redaction and omission markers; shared context is separate. This is the stored representation, not a reconstruction of the original request.</p>
            <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">{JSON.stringify({ callerInput: details.callerInput, sharedContext: details.taskContext ?? null }, null, 2)}</pre>
          </details>
        </> : <p className="mt-2">Additional caller input was not recorded for this older request. Retained tool options are shown below.</p>}
      </section>
      <p className="break-all"><strong>Requested resource:</strong> {event.requested_resource ?? "Not recorded"}</p>
      <h3 className="font-semibold text-slate-950">Tool request</h3>
      <p className="break-all font-mono text-xs">{event.tool_name}</p>
      {details ? <>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 font-mono text-xs">{JSON.stringify({ tool: event.tool_name, arguments: details.arguments }, null, 2)}</pre>
        <p className="text-slate-500">{details.captureBasis === "protocol_request" ? "Allowlisted submitted arguments." : "Allowlisted validated arguments; original payload completeness was not recorded."} URL paths, credentials, queries and fragments are omitted. Tool arguments do not provide access to the original chat conversation.</p>
        {details.argumentsOmitted ? <p className="text-amber-800">Some input was omitted or normalized. This is not the full request payload.</p> : null}
      </> : <p className="break-all text-slate-500">Detailed arguments were not recorded for this event. Retained {event.requested_resource_type ?? "resource"}: {event.requested_resource ?? "unavailable"}.</p>}
      {details?.taskContext ? <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 font-mono text-xs">{JSON.stringify({ callerDeclaredContext: details.taskContext }, null, 2)}</pre> : null}
      {details?.serverVersion ? <p>Server {details.serverVersion} · client version {details.clientVersion ?? "unknown"} · schema {details.toolSchemaVersion ?? "unknown"}</p> : null}
      {details?.response ? <p>Response: {details.response.bytes === null ? "size not recorded" : `${details.response.bytes} bytes`} · truncation {details.response.truncated === null ? "not recorded" : details.response.truncated ? "yes" : "no"}</p> : null}
      <section aria-label="Generated response">
        <h3 className="font-semibold">Generated response</h3>
        <p className="text-xs text-slate-500">Bounded response summary; this records generation, not confirmed client receipt. Untrusted text and raw bodies are omitted.</p>
        {details?.response?.summary ? <>
          {details.response.summary.textOmitted ? <p className="text-amber-800">Some response text was omitted.</p> : null}
          {details.response.summary.summaryTruncated ? <p className="text-amber-800">Summary shortened to fit retention limits.</p> : null}
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 font-mono text-xs">{JSON.stringify(details.response.summary, null, 2)}</pre>
        </> : <p>Response summary not recorded for this request.</p>}
        {details?.serverRevision ? <p className="break-all text-xs">Server revision: {details.serverRevision}</p> : null}
      </section>
      {event.request_id ? <p className="break-all">Request correlation ID: {event.request_id}</p> : null}
      {event.event_id ? <p className="break-all">Telemetry event ID: {event.event_id}</p> : null}
      {details?.requesterChanged !== undefined ? <p>Requester IP versus session initialization: {details.requesterChanged ? "Changed" : "Same"}. Caller identity remains based on initialization; shared provider IPs do not identify people.</p> : null}
      <p>Session: {event.session_id ? <Link className="break-all text-sky-700 underline" href={href(event.session_id)} prefetch={false}>{event.session_id}</Link> : "Not recorded"}{details ? ` (${details.sessionBasis.replaceAll("_", " ")})` : ""}</p>
      <p>{actorBasis}: {event.actor_id ? <Link className="break-all text-sky-700 underline" href={href(event.actor_id)} prefetch={false}>{event.actor_id}</Link> : "Not recorded"}</p>
      <p className="text-slate-500">Neither session nor requester counts establish unique agents or people.</p>
      <p>Rate-limit outcome: {event.quota_outcome === "allowed" ? "No rate limit reported" : event.quota_outcome.replaceAll("_", " ")} · {event.transport_outcome.replaceAll("_", " ")}</p>
      <p>Quota consumed: {details?.response?.summary?.quotaConsumed === true ? "Yes" : details?.response?.summary?.quotaConsumed === false ? "No" : "Not recorded"}. Creation: {details?.response?.summary?.creationDecision?.replaceAll("_", " ") ?? "Not recorded"}.</p>
      <p>Rate-limit outcome alone does not establish that quota was checked or consumed.</p>
      {details?.response?.summary?.anonymousCreationQuota ? <p>Anonymous creation allowance: {details.response.summary.anonymousCreationQuota.remaining} remaining of {details.response.summary.anonymousCreationQuota.limit}; resets {details.response.summary.anonymousCreationQuota.resetAt}. This is separate from weighted read throttling.</p> : null}
      {details?.response?.summary?.firstResult ? <p>Initial scan response: {details.response.summary.firstResult}; preview wait {details.response.summary.previewWaitMs ?? "unknown"} ms; server-internal reads {details.response.summary.internalReadCount ?? "unknown"}. A preliminary preview is not a completed report.</p> : null}
      {details?.response?.summary?.completeness ? <pre className="overflow-auto text-xs">{JSON.stringify({boundedResultCompleteness: details.response.summary.completeness}, null, 2)}</pre> : null}
      {details?.rateLimit ? <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 font-mono text-xs">{JSON.stringify(details.rateLimit, null, 2)}</pre>
        : event.quota_outcome === "rate_limited" ? <p>Limit details were not retained.</p> : null}
  </McpDetailsPopup>;
}
