export function pageViewPredicateSql(prefix = "") {
  if (prefix !== "" && prefix !== "events.") throw new Error("Invalid event SQL prefix");
  return `(${prefix}event_name in ('page_viewed', 'scan_viewed', 'report_viewed') or (${prefix}event_name = 'page_requested' and ${prefix}feature = 'public_page_browser_confirmed'))`;
}

// Both writers use a server-issued identity. Browser confirmation can repair a
// missed background insert, but cannot fabricate a request without its signed proof.
export const PUBLIC_PAGE_UPSERT_SQL = `insert into public.product_analytics_events (
  event_id, occurred_at, event_name, category, feature, outcome, normalized_route,
  consent_state, browser_family, os_family, device_class, is_bot, browser_confirmed_at
) values ($1::uuid, to_timestamp($2::double precision / 1000), 'page_requested', 'navigation',
  case when $4::boolean then 'public_page_browser_confirmed' else 'public_page_request' end,
  'observed', $3, 'operational', 'server', 'server', 'unknown', $5,
  case when $4::boolean then now() else null end)
on conflict (event_id) do update set
  browser_confirmed_at = coalesce(product_analytics_events.browser_confirmed_at, excluded.browser_confirmed_at),
  feature = case when product_analytics_events.browser_confirmed_at is not null or excluded.browser_confirmed_at is not null
    then 'public_page_browser_confirmed' else 'public_page_request' end
where product_analytics_events.event_name = 'page_requested'
  and product_analytics_events.normalized_route = excluded.normalized_route`;
