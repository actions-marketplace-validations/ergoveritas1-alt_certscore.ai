import Link from "next/link";
import { query } from "@website-signal-risk-scanner/db";
import { requirePlatformAdminContext } from "../../../../server/admin/platform-admin";
import { BROWSER_PRODUCT_ID, BROWSER_PRODUCT_CODE, BROWSER_OFFER_ID } from "../../../../server/marketplace-browser/config";
import { RefundForm } from "./refund-form";
export const dynamic="force-dynamic";
export default async function BrowserMarketplaceAdmin() {
  await requirePlatformAdminContext();
  const licenses=await query<{license_arn:string;agreement_id:string|null;status:string;buyer_account_id:string;organization_id:string|null;email:string|null;used:number;verified_at:Date|null;expires_at:Date|null}>(`
    select l.license_arn,l.agreement_id,l.status,l.buyer_account_id,l.organization_id,u.email,coalesce(m.used,0) as used,l.verified_at,l.expires_at
    from marketplace_browser_licenses l left join marketplace_browser_workspaces w using(organization_id)
    left join users u on u.id=w.owner_user_id left join marketplace_browser_usage m on m.organization_id=w.organization_id
      and m.month=date_trunc('month',now() at time zone 'UTC')::date order by l.created_at desc limit 100`);
  const scans=await query<{scan_id:string;organization_id:string;license_arn:string;status:string;created_at:Date;refunded_at:Date|null;refund_reason:string|null;state:string|null}>(`
    select u.*,s.status,s.scan_config_json #>> '{execution,v2DagLambda,dispatchState}' as state
    from marketplace_browser_scan_usage u join scans s on s.id=u.scan_id order by u.created_at desc limit 100`);
  return <section className="space-y-6"><h2 className="text-2xl font-semibold">Browser Marketplace</h2>
    <p className="text-sm text-slate-600">Free · 50 single-page scans per workspace per UTC month · 10-workspace pilot. Status below is the last stored verification; each new scan checks AWS.</p>
    <p className="break-all text-xs">{BROWSER_PRODUCT_ID} · {BROWSER_PRODUCT_CODE} · {BROWSER_OFFER_ID}</p>
    <div className="overflow-auto"><table className="w-full text-left text-sm"><caption className="text-left font-semibold">Subscriptions (latest 100)</caption><thead><tr>{["Owner / buyer","Workspace / agreement / license","Status","This month","Verified / expires"].map(x=><th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>
      {licenses.rows.map(l=><tr key={l.license_arn} className="border-t"><td className="p-3">{l.email??"Unlinked"}<br/>{l.buyer_account_id}</td><td className="max-w-sm break-all p-3">{l.organization_id??"Unlinked"}<br/>{l.agreement_id??"Event pending"}<br/>{l.license_arn}</td><td className="p-3">{l.status}</td><td className="p-3">{l.used} / 50</td><td className="p-3">{l.verified_at?.toISOString()??"Never"}<br/>{l.expires_at?.toISOString()??"No end time received"}</td></tr>)}</tbody></table></div>
    <div className="space-y-3"><h3 className="font-semibold">Attributable fresh scans (latest 100)</h3>{scans.rows.map(s=><article className="rounded border p-4 text-sm" key={s.scan_id}><Link className="underline" href={`/app/admin/scans/${s.scan_id}`}>{s.scan_id}</Link><p className="break-all">{s.organization_id} · {s.license_arn}</p><p>{s.status} · dispatch: {s.state??"unknown"} · {s.created_at.toISOString()}</p>{s.refunded_at?<p>Credit returned: {s.refund_reason}</p>:s.state==="pending_dispatch"&&<RefundForm scanId={s.scan_id}/>}</article>)}</div>
    <p className="text-sm text-slate-600">Recovery cancels and refunds only a proven unattempted dispatch. Already attempted, publishing, or ambiguous work is not automatically refunded. Monitor the separate browser EventBridge/SNS delivery queues and alarms in AWS.</p>
  </section>;
}
