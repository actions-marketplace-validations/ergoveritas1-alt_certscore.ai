import Link from "next/link";
import type { AdminUserEvent } from "../../server/admin/list-admin-user-activity";
import { activityPageLink, retainedActivityPagePath } from "../../lib/product-analytics/activity-page-context";
import { activitySourceLabel, isServerPageRequest } from "../../lib/admin/user-activity-presentation";
import { formatAdminDateTime } from "../../lib/admin/date-time";

function technical(value: string | null) {
  return !value || ["server", "unknown"].includes(value) ? "Not recorded" : value;
}
export function UserActivityEventDetails({ event }: { event: AdminUserEvent }) {
  const page = activityPageLink(event);
  const target = retainedActivityPagePath(event.target_path);
  const previous = retainedActivityPagePath(event.previous_route);
  const rows = [
    ["Event ID", event.event_id], ["Source", activitySourceLabel(event)],
    ["Recorded time", formatAdminDateTime(event.occurred_at)], ["Timestamp (UTC)", new Date(event.occurred_at).toISOString()],
    ["Browser confirmed", event.browser_confirmed_at ? formatAdminDateTime(event.browser_confirmed_at) : "Not recorded"],
    ["Browser / OS", `${technical(event.browser_family)} / ${technical(event.os_family)}`],
    ["Device / viewport", `${technical(event.device_class)} / ${technical(event.viewport_band)}`],
    ["Language", technical(event.language)], ["Country", technical(event.country_code)],
    ["Form", event.form_id ?? "Not recorded"], ["Control", event.element_id ?? "Not recorded"],
    ["Feature", event.feature], ["Entry route", event.entry_route ?? "Not recorded"],
    ["Referring domain", event.referring_domain ?? "Not recorded"],
    ["Recorded duration", event.duration_ms === null ? "Not recorded" : `${event.duration_ms} ms (${event.feature})`],
    ["Recorded value", event.numeric_value === null ? "Not recorded" : `${event.numeric_value} (${event.feature})`],
    ["Attribution", event.is_authenticated ? "Authenticated account" : "Not authenticated"],
    ["Collection basis", event.consent_state],
  ];
  return <details className="min-w-48 max-w-xl text-xs">
    <summary className="cursor-pointer font-medium text-sky-700">Details</summary>
    <div className="mt-2 space-y-2 rounded border border-slate-200 bg-slate-50 p-3">
      <p>{isServerPageRequest(event)
        ? event.browser_confirmed_at ? "The server request was confirmed by the browser on this page. This does not establish that the content was read."
          : "The server recorded a request. Browser display was not confirmed; older server records may include prefetches."
        : activitySourceLabel(event) === "Server" ? "Server-recorded operation. The outcome describes what was recorded, not a browser view."
        : "Client-reported activity; an interaction alone does not establish that a server operation succeeded."}</p>
      <p><strong>Page: </strong>{page ? <Link prefetch={false} className="break-all text-sky-700 underline" href={page}>{`https://certscore.ai${page}`}</Link>
        : <><code>{event.normalized_route}</code> · Exact path not retained</>}</p>
      <p><strong>Previous page: </strong>{previous ? <Link prefetch={false} className="text-sky-700 underline" href={previous}>{previous}</Link> : event.previous_route ?? "Not recorded"}</p>
      <p><strong>Clicked destination: </strong>{target ? <Link prefetch={false} className="break-all text-sky-700 underline" href={target}>{`https://certscore.ai${target}`}</Link> : "Not recorded"}</p>
      <p className="text-slate-500">Links omit query strings and fragments. A clicked destination is not a confirmed visit.</p>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
        {rows.map(([label, value]) => <div key={label} className="contents"><dt className="font-medium text-slate-600">{label}</dt><dd className="min-w-0 break-words text-slate-900">{value}</dd></div>)}
      </dl>
    </div>
  </details>;
}
