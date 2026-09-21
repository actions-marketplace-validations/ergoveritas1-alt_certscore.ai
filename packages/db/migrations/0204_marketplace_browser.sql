-- Separate ownership, lifecycle and allowance. No MCP tables/keys are modified.
alter table organizations add column if not exists marketplace_browser boolean not null default false;

create table marketplace_browser_workspaces (
  organization_id uuid primary key references organizations(id),
  owner_user_id uuid not null references users(id),
  buyer_account_id text not null check (buyer_account_id ~ '^[0-9]{12}$'),
  created_at timestamptz not null default now(),
  welcome_sent_at timestamptz
);
create index marketplace_browser_workspace_owner on marketplace_browser_workspaces(owner_user_id);
create table marketplace_browser_licenses (
  license_arn text primary key,
  product_code text not null check (product_code='1rlcf9he502qz0ix13gqfiaoc'),
  buyer_account_id text not null check (buyer_account_id ~ '^[0-9]{12}$'),
  customer_identifier text,
  organization_id uuid references marketplace_browser_workspaces(organization_id),
  agreement_id text,
  status text not null default 'pending' check (status in ('pending','active','inactive','revoked')),
  expires_at timestamptz,
  event_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index marketplace_browser_license_workspace on marketplace_browser_licenses(organization_id);
create table marketplace_browser_claims (
  token_hash text primary key,
  license_arn text not null references marketplace_browser_licenses(license_arn),
  expires_at timestamptz not null,
  consumed_at timestamptz
);
create index marketplace_browser_claim_expiry on marketplace_browser_claims(expires_at);

-- Short-lived permits are issued only by authenticated browser intake after AWS verification.
create table marketplace_browser_scan_permits (
  id uuid primary key,
  organization_id uuid not null references marketplace_browser_workspaces(organization_id),
  license_arn text not null references marketplace_browser_licenses(license_arn),
  user_id uuid not null references users(id),
  request_id uuid not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);
create table marketplace_browser_usage (
  organization_id uuid not null references marketplace_browser_workspaces(organization_id),
  month date not null,
  used integer not null default 0 check (used between 0 and 50),
  primary key (organization_id, month)
);
create table marketplace_browser_scan_usage (
  scan_id uuid primary key references scans(id) deferrable initially deferred,
  organization_id uuid not null references marketplace_browser_workspaces(organization_id),
  license_arn text not null references marketplace_browser_licenses(license_arn),
  request_id uuid not null,
  month date not null,
  created_at timestamptz not null default now(),
  refunded_at timestamptz,
  refund_reason text,
  unique (organization_id, request_id)
);

-- Inserting the durable scan dispatch outbox and debiting a credit is one transaction.
-- Covers alternate intake paths, schedulers and accidental direct SQL insertions too.
create or replace function reserve_marketplace_browser_scan() returns trigger language plpgsql as $$
declare
  permit marketplace_browser_scan_permits%rowtype;
  license marketplace_browser_licenses%rowtype;
  period date := date_trunc('month', now() at time zone 'UTC')::date;
  balance integer;
begin
  if not exists(select 1 from organizations where id=new.organization_id and marketplace_browser) then
    return new;
  end if;
  if new.pages_requested <> 1 or new.scan_type <> 'full'
    or coalesce((new.scan_config_json->>'fullSite')::boolean,false)
    or new.scan_config_json->>'source' is distinct from 'marketplace-browser' then
    raise exception 'Marketplace browser access supports manual single-page scans only.';
  end if;
  select * into permit from marketplace_browser_scan_permits
    where id::text=new.scan_config_json->>'marketplaceBrowserPermit' for update;
  if not found or permit.organization_id<>new.organization_id
    or permit.user_id is distinct from new.submitted_by_user_id
    or permit.expires_at<=now() or permit.consumed_at is not null then
    raise exception 'A fresh authenticated Marketplace scan authorization is required.';
  end if;
  select * into license from marketplace_browser_licenses where license_arn=permit.license_arn for update;
  if not found or license.organization_id is distinct from new.organization_id
    or license.status<>'active' or license.verified_at is null
    or license.verified_at<now()-interval '5 minutes'
    or (license.expires_at is not null and license.expires_at<=now())
    or not exists(select 1 from marketplace_browser_workspaces where organization_id=new.organization_id and owner_user_id=permit.user_id) then
    raise exception 'The Marketplace subscription is not currently verified as active.';
  end if;
  insert into marketplace_browser_usage(organization_id,month) values(new.organization_id,period) on conflict do nothing;
  update marketplace_browser_usage set used=used+1
    where organization_id=new.organization_id and month=period and used<50 returning used into balance;
  if not found then raise exception 'Your 50 single-page scans for this UTC calendar month have been used.'; end if;
  insert into marketplace_browser_scan_usage(scan_id,organization_id,license_arn,request_id,month)
    values(new.id,new.organization_id,license.license_arn,permit.request_id,period);
  update marketplace_browser_scan_permits set consumed_at=now() where id=permit.id;
  new.scan_config_json := (new.scan_config_json-'marketplaceBrowserPermit') || jsonb_build_object(
    'marketplaceBrowser', jsonb_build_object('licenseArn',license.license_arn,'productCode',license.product_code,'requestId',permit.request_id,'month',period));
  return new;
end $$;
create trigger marketplace_browser_scan_guard before insert on scans for each row execute function reserve_marketplace_browser_scan();

-- Dedicated workspaces cannot accidentally acquire Stripe billing or lose their guard.
create or replace function protect_marketplace_browser_workspace() returns trigger language plpgsql as $$
begin
  if old.marketplace_browser and (not new.marketplace_browser
    or new.stripe_customer_id is not null or new.stripe_subscription_id is not null
    or new.plan is distinct from old.plan) then
    raise exception 'Marketplace browser workspaces have separate subscription management.';
  end if;
  return new;
end $$;
create trigger marketplace_browser_billing_guard before update on organizations for each row execute function protect_marketplace_browser_workspace();

-- Recovery locks the same scan row as the dispatch worker. Never refund an attempted dispatch.
alter table marketplace_browser_scan_usage add column refunded_by_user_id uuid references users(id);
create or replace function refund_undispatched_marketplace_browser_scan(target uuid, actor uuid, reason text)
returns boolean language plpgsql as $$
declare s scans%rowtype; u marketplace_browser_scan_usage%rowtype;
begin
  if length(trim(reason)) < 5 or length(reason) > 500 then raise exception 'A bounded recovery reason is required.'; end if;
  select * into s from scans where id=target for update;
  if not found then return false; end if;
  select * into u from marketplace_browser_scan_usage where scan_id=target for update;
  if not found or u.refunded_at is not null then return false; end if;
  if s.status not in ('queued','running','failed')
    or s.scan_config_json #>> '{execution,v2DagLambda,dispatchState}' is distinct from 'pending_dispatch'
    or coalesce((s.scan_config_json #>> '{execution,v2DagLambda,dispatchAttemptCount}')::int,0)<>0 then
    raise exception 'Dispatch is not proven unattempted. Investigate without refunding.';
  end if;
  update scans set status='failed',error_message='Cancelled before dispatch by support; Marketplace credit returned.',updated_at=now() where id=target;
  update marketplace_browser_usage set used=used-1 where organization_id=u.organization_id and month=u.month and used>0;
  if not found then raise exception 'Allowance ledger mismatch.'; end if;
  update marketplace_browser_scan_usage set refunded_at=now(),refunded_by_user_id=actor,refund_reason=trim(reason) where scan_id=target;
  return true;
end $$;
