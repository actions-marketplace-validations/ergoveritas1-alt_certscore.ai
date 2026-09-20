// Keep whole workflow groups inside the existing 5,000-call budget. A byte budget
// also leaves room for enrichment/serialization in the shared 2 MB data cache.
// Visibility is repository-owned SQL; all user input remains parameterized.
export function mcpWorkflowCohortSql(visibility: string) {
  return `cohort as materialized (
    select events.*, jsonb_build_array(events.surface, events.source, events.client_name,
      coalesce(events.session_id, events.event_id::text), coalesce(events.scan_id, events.event_id::text)) as workflow_key
    from public.mcp_tool_invocation_events events
    where events.occurred_at >= now() - ($1::int * interval '1 hour') and events.occurred_at <= now()
      and ($2::text is null or events.client_name = $2)
      and ($3::text is null or events.surface = $3)
      and ($4::text is null or events.source = $4)
      and (${visibility})
  ), group_sizes as (
    select workflow_key, count(*) as calls, max(occurred_at) as latest,
      sum(octet_length(to_jsonb(cohort)::text)) as bytes
    from cohort group by workflow_key
  ), ranked_groups as (
    select workflow_key,
      sum(calls) over (order by latest desc, workflow_key) as running_calls,
      sum(bytes) over (order by latest desc, workflow_key) as running_bytes
    from group_sizes where calls <= 5000 and bytes <= 750000
  ), recent as materialized (
    select cohort.* from cohort join ranked_groups using (workflow_key)
    where running_calls <= 5000 and running_bytes <= 750000
  )`;
}
