-- Public PKCE client: the ID is configuration, never a credential or identity proof.
insert into public.mcp_oauth_clients (client_id, client_name, redirect_uris, scope)
values ('certscore_cursor_hosted_oauth_v1', 'Cursor — CertScore Hosted OAuth',
  '["https://www.cursor.com/agents/mcp/oauth/callback","http://localhost:8787/callback"]'::jsonb,
  array['scan:read','scan:create','mcp'])
on conflict (client_id) do nothing;
