-- Deploy the reader and this constraint before enabling expanded MCP capture.
alter table public.mcp_tool_invocation_events
  drop constraint if exists mcp_request_details_bounded;
alter table public.mcp_tool_invocation_events
  add constraint mcp_request_details_bounded check (
    request_details is null or (
      jsonb_typeof(request_details) = 'object'
      and octet_length(request_details::text) <= case
        when request_details ->> 'version' = '2' then 16384 else 4096 end
    )
  );
comment on column public.mcp_tool_invocation_events.request_details is
  'Versioned, sanitized caller input and response metadata. V1: 4 KiB; V2: 16 KiB. Not a raw request archive; omissions and redactions are explicit. No original conversation is implied.';
