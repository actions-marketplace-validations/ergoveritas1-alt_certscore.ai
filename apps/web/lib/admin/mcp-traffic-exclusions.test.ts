import assert from "node:assert/strict";
import test from "node:test";
import pg from "pg";
import { MCP_TRAFFIC_EXCLUSIONS_SQL } from "./mcp-traffic-exclusions";

const databaseUrl = process.env.MCP_DISCOVERY_TEST_DATABASE_URL;
test("cached classification preserves direct user, key owner, auth user, reuse and Mac mini exclusions", { skip: !databaseUrl }, async () => {
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl!).hostname));
  const db = new pg.Client({ connectionString: databaseUrl });
  await db.connect();
  try {
    await db.query(`create temporary table pulse_requests(scan_id text, requested_by jsonb);
      create temporary table scan_requests(scan_id text, fulfilled_by_scan_id text, requested_by jsonb);
      create temporary table integration_api_keys(public_id text, name text, owner_user_id text, created_by text);
      create temporary table users(id text, email text);
      create temporary table better_auth_users(id text, email text);
      insert into users values ('qa', 'QA@example.test'), ('customer', 'customer@example.test');
      insert into better_auth_users values ('auth-qa','qa@example.test');
      insert into integration_api_keys values ('key-qa','ordinary','qa',null), ('key-mini','mini',null,null), ('key-created','ordinary',null,'qa@example.test');
      insert into pulse_requests values ('direct','{"userId":"qa"}'), ('key','{"apiKeyId":"key-qa"}'), ('auth','{"userId":"auth-qa"}'), ('created','{"apiKeyId":"key-created"}'), ('mini','{"apiKeyId":"key-mini"}'), ('external','{"userId":"customer"}'), ('unknown','{}'), (null,'{"userId":"qa"}');
      insert into scan_requests values ('requested','fulfilled','{"userId":"qa"}'), ('fallback',null,'{"userId":"qa"}'), ('mini-request','mini-fulfilled','{"apiKeyId":"key-mini"}'), ('direct',null,'{"userId":"qa"}');`);
    const { rows } = await db.query(MCP_TRAFFIC_EXCLUSIONS_SQL.replaceAll('public.', 'pg_temp.'), [['qa@example.test'],['mini']]);
    assert.deepEqual(rows[0].qa.sort(), ['auth','created','direct','fallback','fulfilled','key']);
    assert.deepEqual(rows[0].macmini.sort(), ['mini','mini-fulfilled']);
  } finally { await db.end(); }
});
