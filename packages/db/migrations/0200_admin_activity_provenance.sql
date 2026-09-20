-- Ingestion-time classification. Historical rows remain explicitly unknown.
-- No client-name substring (including "probe") establishes internal ownership.
alter table public.product_analytics_events add column if not exists mcp_session_id text
  check (mcp_session_id is null or mcp_session_id ~ '^[a-f0-9]{24}$');
alter table public.mcp_activation_events add column if not exists authenticated_user_id uuid references public.users(id) on delete set null;
alter table public.mcp_activation_events add column if not exists is_staff boolean not null default false;

create or replace function public.classify_admin_activity_v1(e jsonb) returns jsonb
language plpgsql stable as $$
declare
  kind text := 'unknown'; basis text := 'insufficient_provenance';
  owner_email text; key_name text; key_found boolean := false; linked jsonb;
  owner_id text := coalesce(e->>'authenticated_user_id',e->>'user_id',e->>'submitted_by_user_id',e->'requested_by'->>'userId');
begin
  if e ? 'tool_name' and e->>'session_id' is not null then
    select a.activity_traffic into linked from public.mcp_activation_events a
      where a.session_id=e->>'session_id' and a.surface=e->>'surface'
        and a.actor_id is not distinct from e->>'actor_id'
        and a.occurred_at <= (e->>'occurred_at')::timestamptz
        and a.occurred_at >= (e->>'occurred_at')::timestamptz - interval '90 days'
        and a.activity_traffic->>'class' <> 'unknown'
      order by a.occurred_at desc limit 1;
  end if;
  if e->'requested_by'->>'apiKeyId' is not null then
    select k.name, coalesce(u.email,auth_user.email,k.created_by) into key_name,owner_email
      from public.integration_api_keys k left join public.users u on u.id::text=k.owner_user_id
      left join public.better_auth_users auth_user on auth_user.id=k.owner_user_id
      where k.public_id=e->'requested_by'->>'apiKeyId' limit 1;
    key_found := found;
  end if;
  if owner_email is null and owner_id is not null then
    select u.email into owner_email from public.users u where u.id::text=owner_id limit 1;
    if owner_email is null then
      select u.email into owner_email from public.better_auth_users u where u.id=owner_id limit 1;
    end if;
  end if;
  if key_name = any(array['CertScore paired-region production daemon','CertScore 500/day API key','Production scanning daemon','Codex failed-scan 72h audit']) then
    kind := 'automation'; basis := 'owned_daemon_credential';
  elsif e->>'is_staff'='true' or lower(coalesce(owner_email,''))='bmasek@gmail.com' then
    kind := 'internal'; basis := 'staff_account';
  elsif e->>'is_canary'='true' or coalesce(e->>'requested_url','') ~* '^https?://[^/?#]+/\.well-known/certscore-canary/' then
    kind := 'internal'; basis := 'retained_canary';
  elsif coalesce(e->>'requester_ip',e->'request_context'->>'sourceIp',e->'request_context'->'provenance'->>'sourceIp',e->'requested_by'->>'sourceIp','') in ('66.27.64.248','66.27.64.248/32') then
    kind := 'internal'; basis := 'registered_qa_network';
  elsif e->>'is_bot'='true' then
    kind := 'automation'; basis := 'detected_bot';
  elsif linked->>'class' in ('internal','automation') then
    kind := linked->>'class'; basis := 'retained_session_provenance';
  elsif owner_email is not null or key_found then
    kind := 'external'; basis := 'authenticated_nonstaff_owner';
  elsif linked->>'class'='external' then
    kind := 'external'; basis := 'retained_session_provenance';
  elsif e->>'source_attribution'='verified_network' and e->>'source' in ('openai','anthropic','google','xai') then
    kind := 'external'; basis := 'verified_provider_network';
  end if;
  return jsonb_build_object('version',1,'class',kind,'basis',basis);
end $$;

create or replace function public.retain_admin_activity_provenance_v1() returns trigger
language plpgsql as $$
begin
  -- Capture only on insert: later account/registry changes must not silently rewrite history.
  new.activity_traffic := public.classify_admin_activity_v1(to_jsonb(new));
  return new;
end $$;

do $$ declare tab text; begin
  foreach tab in array array['product_analytics_events','mcp_activation_events','mcp_tool_invocation_events','scan_requests','pulse_requests','scans'] loop
    execute format('alter table public.%I add column if not exists activity_traffic jsonb not null default ''{"version":1,"class":"unknown","basis":"legacy_unclassified"}''::jsonb',tab);
    execute format('create trigger retain_activity_provenance before insert on public.%I for each row execute function public.retain_admin_activity_provenance_v1()',tab);
  end loop;
end $$;
