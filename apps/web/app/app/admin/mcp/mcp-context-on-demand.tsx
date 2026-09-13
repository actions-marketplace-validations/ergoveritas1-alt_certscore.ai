"use client";

import { useState } from "react";
import Link from "next/link";
import type { loadMcpContext } from "./mcp-context-action";

type Context = Awaited<ReturnType<typeof loadMcpContext>>;
export function McpContextOnDemand({ eventId, traffic, kind }: { eventId: string; traffic: string; kind: "caller" | "related" }) {
  const [data, setData] = useState<Context | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  async function load() {
    setPending(true);
    setFailed(false);
    try {
      const { loadMcpContext } = await import("./mcp-context-action");
      setData(await loadMcpContext(eventId, traffic));
    }
    catch { setFailed(true); }
    finally { setPending(false); }
  }
  if (!data) return <div className="text-xs">
    <button className="text-sky-700 underline disabled:text-slate-500" type="button" disabled={pending} onClick={load}>
      {pending ? "Loading…" : failed ? "Retry loading details" : kind === "caller" ? "Load caller activity" : "Look up earlier context"}
    </button>
    {failed ? <p role="alert">Details could not be loaded. Counts and context are unknown.</p> : null}
    {pending ? <span role="status" className="sr-only">Loading details</span> : null}
  </div>;
  if (kind === "caller") {
    const counts = data.callerActivity;
    return <p className="text-xs tabular-nums" title="Same caller, provider, entrypoint and traffic scope, as of this request. Correlation does not identify a unique person.">
      {counts ? <>5m: {counts.calls5m} · 10m: {counts.calls10m} · 60m: {counts.calls60m} · 24hr: {counts.calls24h}<br />Rate limits in 60m: {counts.quotaHits60m}</> : "Caller activity unknown"}
    </p>;
  }
  const context = data.relatedContext;
  return context ? <section className="rounded-lg border border-slate-200 p-3">
    <h3 className="font-semibold">Context from an earlier call</h3>
    <p className="mt-1 text-xs text-slate-500">Same caller, session, scan and entrypoint; not supplied with this call. {context.taskContext.questionSource === "user_wording" ? "Shared user wording" : "Agent paraphrase"}.</p>
    <p className="mt-2 whitespace-pre-wrap">{context.taskContext.questionSummary}</p>
    <Link className="text-xs text-sky-700 underline" prefetch={false} href={`/app/admin/mcp?${new URLSearchParams({ q: context.eventId, traffic, timeSpan: "all" })}`}>Source request · {context.occurredAt}</Link>
  </section> : <p className="text-xs text-slate-500">No eligible earlier context was retained.</p>;
}
