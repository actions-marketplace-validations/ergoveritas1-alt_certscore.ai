// Parameters: internal QA emails, then Mac mini integration key names.
export const MCP_TRAFFIC_EXCLUSIONS_SQL = `
    with requests as (
      select scan_id, requested_by from public.pulse_requests where scan_id is not null
      union all
      select coalesce(fulfilled_by_scan_id, scan_id), requested_by from public.scan_requests
        where coalesce(fulfilled_by_scan_id, scan_id) is not null
    ), classified as (
      select request.scan_id::text as scan_id,
        lower(coalesce(linked_user.email, linked_auth_user.email, linked_key.created_by, '')) = any($1::text[]) as qa,
        linked_key.name = any($2::text[]) as macmini
      from requests request
      left join public.integration_api_keys linked_key on linked_key.public_id = request.requested_by ->> 'apiKeyId'
      left join public.users linked_user on linked_user.id::text = coalesce(request.requested_by ->> 'userId', linked_key.owner_user_id::text)
      left join public.better_auth_users linked_auth_user on linked_auth_user.id = request.requested_by ->> 'userId'
    ) select coalesce(array_agg(distinct scan_id) filter(where qa), '{}') as qa,
      coalesce(array_agg(distinct scan_id) filter(where macmini), '{}') as macmini from classified`;
