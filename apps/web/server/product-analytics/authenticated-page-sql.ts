/** Signed identity + authenticated user bind both arrival orders to exactly one request. */
export const AUTHENTICATED_PAGE_UPSERT_SQL = `insert into public.product_analytics_events (
  event_id, occurred_at, event_name, category, feature, outcome, normalized_route, page_path,
  user_id, organization_id, scan_id, consent_state, is_authenticated, is_staff,
  browser_family, os_family, device_class, is_bot, browser_confirmed_at, language, viewport_band, country_code
) values ($1::uuid, to_timestamp($2::double precision/1000), 'page_requested', 'navigation',
  case when $8::boolean then 'authenticated_page_browser_confirmed' else 'authenticated_page_request' end,
  'observed', $3, $4, $5::uuid, $6::uuid, $7::uuid, 'operational', true, $9,
  $10, $11, $12, $13, case when $8::boolean then now() else null end, $14, $15, $16)
on conflict (event_id) do update set
  browser_confirmed_at = coalesce(product_analytics_events.browser_confirmed_at, excluded.browser_confirmed_at),
  feature = case when product_analytics_events.browser_confirmed_at is not null or excluded.browser_confirmed_at is not null
    then 'authenticated_page_browser_confirmed' else 'authenticated_page_request' end,
  country_code = coalesce(product_analytics_events.country_code, excluded.country_code),
  language = coalesce(product_analytics_events.language, excluded.language),
  viewport_band = coalesce(product_analytics_events.viewport_band, excluded.viewport_band)
where product_analytics_events.event_name='page_requested'
  and product_analytics_events.feature in ('authenticated_page_request','authenticated_page_browser_confirmed')
  and product_analytics_events.user_id=excluded.user_id
  and product_analytics_events.page_path=excluded.page_path
  and product_analytics_events.normalized_route=excluded.normalized_route`;
