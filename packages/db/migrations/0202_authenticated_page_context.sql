alter table public.product_analytics_events
  add column if not exists page_path text check (page_path is null or (char_length(page_path) <= 300 and page_path like '/app%' and page_path !~ '[?#]')),
  add column if not exists target_path text check (target_path is null or (char_length(target_path) <= 300 and target_path like '/app%' and target_path !~ '[?#]'));

comment on column public.product_analytics_events.page_path is
  'Allowlisted authenticated application path, including approved resource UUIDs. No query strings, fragments, credentials or arbitrary path values. Historical normalized paths are not expanded by inference.';
comment on column public.product_analytics_events.target_path is
  'Allowlisted application destination of a client-reported navigation click. A click is not proof that the destination loaded.';
comment on column public.product_analytics_events.browser_confirmed_at is
  'First browser confirmation of a signed page request. Authenticated proofs bind the request to the authenticated user and exact allowlisted path; public proofs remain anonymous. Null means unconfirmed, not unseen.';
