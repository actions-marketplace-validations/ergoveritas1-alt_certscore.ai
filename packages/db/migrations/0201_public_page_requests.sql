alter table public.product_analytics_events
  drop constraint if exists product_analytics_events_event_name_check;

alter table public.product_analytics_events
  add constraint product_analytics_events_event_name_check
  check (event_name in (
    'page_requested', 'page_viewed', 'navigation_clicked', 'action_clicked', 'form_started',
    'form_submitted', 'form_succeeded', 'form_failed', 'scan_started', 'scan_completed', 'scan_viewed',
    'report_viewed', 'scroll_depth_reached', 'session_engaged',
    'web_vital_recorded', 'client_error', 'account_created',
    'oauth_authorized', 'mcp_initialized', 'mcp_tools_listed',
    'mcp_first_tool_invoked', 'mcp_scan_requested',
    'analytics_opted_in', 'analytics_opted_out'
  ));

alter table public.product_analytics_events
  add column if not exists browser_confirmed_at timestamptz;

comment on column public.product_analytics_events.browser_confirmed_at is
  'First browser confirmation of a signed anonymous public-page request. Null means unconfirmed, not unseen. The same request ID occupies one row in either arrival order.';
