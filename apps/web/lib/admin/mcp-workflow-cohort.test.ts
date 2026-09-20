import assert from 'node:assert/strict';
import test from 'node:test';
import pg from 'pg';
import { mcpWorkflowCohortSql } from './mcp-workflow-cohort';

const databaseUrl = process.env.MCP_DISCOVERY_TEST_DATABASE_URL;
test('workflow budgets never split a group and preserve the total when no group fits', { skip: !databaseUrl }, async () => {
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(databaseUrl!).hostname));
  const db = new pg.Client({ connectionString: databaseUrl });
  await db.connect();
  try {
    await db.query(`create temporary table mcp_tool_invocation_events (
      event_id text, occurred_at timestamptz default now(), session_id text, scan_id text,
      client_name text default 'client', source text default 'unknown', surface text default 'mcp_light',
      is_canary boolean default false, request_details jsonb
    );
    insert into mcp_tool_invocation_events(event_id, session_id, scan_id, occurred_at)
      values ('start','session','scan',now()-interval '2 hours'),('finish','session','scan',now()),
      ('other-client','session','scan',now()-interval '1 hour'),('qa','qa','qa',now());
    update mcp_tool_invocation_events set client_name='different' where event_id='other-client';
    update mcp_tool_invocation_events set is_canary=true where event_id='qa';
    insert into mcp_tool_invocation_events(event_id,session_id,scan_id,occurred_at)
      select 'bulk-'||n,'big-session','big-scan',now()-interval '1 hour' from generate_series(1,5000) n;`);
    const sql = `with ${mcpWorkflowCohortSql('not events.is_canary').replaceAll('public.', 'pg_temp.')}
      select (select count(*)::int from cohort) total,
      coalesce((select array_agg(event_id order by event_id) from recent), '{}') ids`;
    const run = (client: string | null) => db.query(sql, [24, client, null, null]);
    const result = (await run(null)).rows[0];
    assert.equal(result.total, 5003);
    assert.ok(result.ids.includes('start') && result.ids.includes('finish'), 'both ends of the newest workflow survive');
    assert.equal(result.ids.some((id: string) => id.startsWith('bulk-')), false, 'a group that exceeds the remaining budget is omitted whole');
    assert.deepEqual((await run('different')).rows[0].ids, ['other-client']);
    await db.query(`update mcp_tool_invocation_events set request_details=jsonb_build_object('large',repeat('x',800000)) where event_id='finish'`);
    const oversized = (await run('client')).rows[0];
    assert.equal(oversized.total, 5002);
    assert.deepEqual(oversized.ids, [], 'an oversized newest group is explicitly limited, never truncated');
  } finally { await db.end(); }
});
