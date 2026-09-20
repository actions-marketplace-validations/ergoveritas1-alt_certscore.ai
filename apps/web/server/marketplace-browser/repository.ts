import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { query, queryOne, withWriteTransaction } from "@website-signal-risk-scanner/db";
import type { LicenseEvent, ResolvedCustomer } from "../marketplace/contracts";
import { BROWSER_PRODUCT_CODE } from "./config";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const validClaim = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);
export type BrowserLicense = {
  license_arn: string; buyer_account_id: string; agreement_id: string | null;
  organization_id: string | null; status: string; expires_at: Date | string | null;
  verified_at: Date | string | null; event_at: Date | string | null;
};
export async function createBrowserClaim(customer: ResolvedCustomer & { CustomerIdentifier?: string }) {
  if (customer.ProductCode !== BROWSER_PRODUCT_CODE) throw new Error("Unexpected product.");
  const token = randomBytes(32).toString("base64url");
  await withWriteTransaction(async client => {
    await client.query(`insert into marketplace_browser_licenses(license_arn,product_code,buyer_account_id,customer_identifier)
      values($1,$2,$3,$4) on conflict(license_arn) do nothing`,
    [customer.LicenseArn, customer.ProductCode, customer.CustomerAWSAccountId, customer.CustomerIdentifier ?? null]);
    const binding = await client.query(`select license_arn from marketplace_browser_licenses
      where license_arn=$1 and product_code=$2 and buyer_account_id=$3`, [customer.LicenseArn, customer.ProductCode, customer.CustomerAWSAccountId]);
    if (!binding.rowCount) throw new Error("Marketplace identity mismatch.");
    await client.query(`delete from marketplace_browser_claims where expires_at<now()`);
    await client.query(`insert into marketplace_browser_claims(token_hash,license_arn,expires_at) values($1,$2,now()+interval '30 minutes')`, [hash(token),customer.LicenseArn]);
  });
  return token;
}
export function getBrowserClaim(token: string) {
  if (!validClaim(token)) return Promise.resolve(null);
  return queryOne<BrowserLicense>(`select l.* from marketplace_browser_claims c join marketplace_browser_licenses l using(license_arn)
    where c.token_hash=$1 and c.expires_at>now() and c.consumed_at is null`, [hash(token)]);
}

// Dedicated workspaces avoid replacing ordinary membership or Stripe entitlements.
// Re-subscription reuses the oldest inactive slot, preserving its monthly ledger.
export async function claimBrowserLicense(token: string, userId: string) {
  if (!validClaim(token)) throw new Error("Return to AWS Marketplace and choose Set up your account.");
  return withWriteTransaction(async client => {
    await client.query(`select pg_advisory_xact_lock(2040050)`);
    const result = await client.query<BrowserLicense>(`select l.* from marketplace_browser_claims c
      join marketplace_browser_licenses l using(license_arn) where c.token_hash=$1 and c.expires_at>now()
      and c.consumed_at is null for update of c,l`, [hash(token)]);
    const license = result.rows[0];
    if (!license || license.status === "revoked") throw new Error("This setup link is expired or inactive. Restart setup from AWS Marketplace.");
    let org = license.organization_id;
    if (org) {
      const owner = await client.query(`select organization_id from marketplace_browser_workspaces where organization_id=$1 and owner_user_id=$2`, [org,userId]);
      if (!owner.rowCount) throw new Error("This subscription is linked to another CertScore account.");
    } else {
      // Buyer ownership prevents free-credit resets by relinking a cancelled buyer to another user.
      const otherOwner = await client.query(`select 1 from marketplace_browser_workspaces where buyer_account_id=$1 and owner_user_id<>$2 limit 1`, [license.buyer_account_id,userId]);
      if (otherOwner.rowCount) throw new Error("This AWS buyer is already linked to another account. Contact support for an ownership review.");
      const reusable = await client.query<{ organization_id: string }>(`select w.organization_id from marketplace_browser_workspaces w
        where w.buyer_account_id=$1 and w.owner_user_id=$2 and not exists(
          select 1 from marketplace_browser_licenses l where l.organization_id=w.organization_id
          and l.status<>'revoked' and (l.expires_at is null or l.expires_at>now()))
        order by w.created_at limit 1`, [license.buyer_account_id,userId]);
      org = reusable.rows[0]?.organization_id ?? null;
      if (!org) {
        const unsettled=await client.query(`select 1 from marketplace_browser_licenses l join marketplace_browser_workspaces w using(organization_id)
          where w.buyer_account_id=$1 and w.owner_user_id=$2 and l.status<>'revoked' and (l.expires_at is null or l.expires_at>now())
          and (l.status<>'active' or l.verified_at is null or l.verified_at<now()-interval '5 minutes') limit 1`,[license.buyer_account_id,userId]);
        if(unsettled.rowCount) throw new Error("An existing subscription needs verification before another workspace can be linked.");
        org = randomUUID();
        await client.query(`insert into organizations(id,name,slug,plan,plan_status,marketplace_browser)
          values($1,'Marketplace Website Scanner',$2,'individual','active',true)`, [org,`marketplace-browser-${org}`]);
        await client.query(`insert into marketplace_browser_workspaces(organization_id,owner_user_id,buyer_account_id) values($1,$2,$3)`, [org,userId,license.buyer_account_id]);
      }
      await client.query(`update marketplace_browser_licenses set organization_id=$2 where license_arn=$1`, [license.license_arn,org]);
    }
    await client.query(`update marketplace_browser_claims set consumed_at=now() where token_hash=$1`, [hash(token)]);
    return org!;
  });
}
export function getBrowserLicense(arn: string) {
  return queryOne<BrowserLicense>(`select * from marketplace_browser_licenses where license_arn=$1`, [arn]);
}
export async function applyBrowserEvent(event: LicenseEvent, active: boolean, expires: Date | null) {
  const d=event.detail;
  const status=event["detail-type"] === "License Deprovisioned - Manufacturer" ? "revoked" : active ? "active" : "inactive";
  await query(`insert into marketplace_browser_licenses(license_arn,product_code,buyer_account_id,agreement_id,status,expires_at,event_at,verified_at)
    values($1,$2,$3,$4,$5,$6,$7,now()) on conflict(license_arn) do update set
    agreement_id=excluded.agreement_id,status=excluded.status,expires_at=excluded.expires_at,event_at=excluded.event_at,verified_at=now()
    where marketplace_browser_licenses.product_code=excluded.product_code
    and marketplace_browser_licenses.buyer_account_id=excluded.buyer_account_id
    and (marketplace_browser_licenses.agreement_id is null or marketplace_browser_licenses.agreement_id=excluded.agreement_id)
    and marketplace_browser_licenses.status<>'revoked'
    and (excluded.status='revoked' or marketplace_browser_licenses.event_at is null or marketplace_browser_licenses.event_at<excluded.event_at)`,
  [d.license.arn,d.product.code,d.acceptor.accountId,d.agreement.id,status,expires,event.time]);
}
export async function saveBrowserVerification(license: BrowserLicense, active: boolean, expires: Date | null) {
  // A newer event/revocation arriving during the AWS read wins over this snapshot.
  await query(`update marketplace_browser_licenses set status=$2,expires_at=$3,verified_at=now()
    where license_arn=$1 and status<>'revoked' and agreement_id=$4 and event_at is not distinct from $5::timestamptz`,
  [license.license_arn,active ? "active" : "inactive",expires,license.agreement_id,license.event_at]);
}
export async function ownedBrowserWorkspace(org: string, user: string) {
  return queryOne<{ id: string; name: string; slug: string; created_at: string; updated_at: string; owner_user_id: string }>(
    `select o.id,o.name,o.slug,o.created_at,o.updated_at,w.owner_user_id from marketplace_browser_workspaces w
    join organizations o on o.id=w.organization_id where w.organization_id=$1 and w.owner_user_id=$2`,[org,user]);
}
export async function isBrowserWorkspace(org: string) {
  const row = await queryOne<{ marketplace_browser: boolean }>(`select marketplace_browser from organizations where id=$1`,[org]);
  return row?.marketplace_browser === true;
}
export async function listBrowserWorkspaces(user: string) {
  return (await query<{ organization_id: string; buyer_account_id: string; name: string; used: number; license_arn: string | null; status: string | null; expires_at: string | null; verified_at: string | null; welcome_sent_at: string | null }>(
    `select w.organization_id,w.buyer_account_id,o.name,coalesce(u.used,0) as used,l.license_arn,l.status,l.expires_at,l.verified_at,w.welcome_sent_at
    from marketplace_browser_workspaces w join organizations o on o.id=w.organization_id
    left join marketplace_browser_usage u on u.organization_id=w.organization_id and u.month=date_trunc('month',now() at time zone 'UTC')::date
    left join lateral(select * from marketplace_browser_licenses l where l.organization_id=w.organization_id order by l.created_at desc, l.license_arn limit 1) l on true
    where w.owner_user_id=$1 order by w.created_at limit 10`, [user])).rows;
}
export async function currentBrowserLicense(org: string, user: string) {
  return queryOne<BrowserLicense>(`select l.* from marketplace_browser_licenses l join marketplace_browser_workspaces w using(organization_id)
    where w.organization_id=$1 and w.owner_user_id=$2 and l.status<>'revoked'
    and (l.expires_at is null or l.expires_at>now()) order by l.created_at desc limit 1`,[org,user]);
}
export async function createBrowserScanPermit(license: BrowserLicense, user: string, requestId: string) {
  const id=randomUUID();
  await withWriteTransaction(async client=>{
    await client.query(`delete from marketplace_browser_scan_permits where expires_at<now()`);
    await client.query(`insert into marketplace_browser_scan_permits(id,organization_id,license_arn,user_id,request_id,expires_at)
      values($1,$2,$3,$4,$5,now()+interval '2 minutes')`,[id,license.organization_id,license.license_arn,user,requestId]);
  });
  return id;
}
export async function browserScanHistory(org: string, user: string) {
  return (await query<{ id: string; status: string; created_at: string; normalized_url: string; refunded_at: string | null }>(
    `select * from (select distinct on (h.id) h.* from (
      select s.id,s.status,s.created_at,d.normalized_url,u.refunded_at from marketplace_browser_scan_usage u
      join marketplace_browser_workspaces w using(organization_id) join scans s on s.id=u.scan_id join domains d on d.id=s.domain_id
      where w.organization_id=$1 and w.owner_user_id=$2
      union all
      select s.id,s.status,r.requested_at as created_at,r.normalized_url,null::timestamptz as refunded_at
      from scan_requests r join marketplace_browser_workspaces w on w.organization_id=r.organization_id
      join scans s on s.id=r.fulfilled_by_scan_id where w.organization_id=$1 and w.owner_user_id=$2
      and r.resolution_mode='reused_existing_scan'
    ) h order by h.id,h.created_at desc) recent order by created_at desc limit 50`,[org,user])).rows;
}
export async function browserRequestScan(org: string, request: string) {
  return queryOne<{ id: string }>(`select scan_id as id from marketplace_browser_scan_usage where organization_id=$1 and request_id=$2`,[org,request]);
}
