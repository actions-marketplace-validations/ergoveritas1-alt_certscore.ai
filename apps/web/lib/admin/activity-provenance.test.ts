import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import pg from "pg";
import { activityTrafficLabel, activityTrafficSql } from "./activity-provenance";

test("audience labels never promote absent or caller-declared provenance", () => {
  assert.equal(activityTrafficLabel(undefined), "Unknown audience");
  assert.equal(activityTrafficLabel("probe"), "Unknown audience");
  assert.match(activityTrafficSql("events"), /activity_traffic/);
  assert.throws(() => activityTrafficSql("untrusted;sql"));
});

const databaseUrl = process.env.MCP_DISCOVERY_TEST_DATABASE_URL;
test("ingestion persists versioned traffic and preserves opaque MCP session linkage", { skip: !databaseUrl }, async () => {
  assert.ok(["localhost","127.0.0.1","[::1]"].includes(new URL(databaseUrl!).hostname));
  const db = new pg.Client({ connectionString: databaseUrl }); await db.connect();
  try {
    await db.query(`begin;
      create temp table users(id uuid primary key,email text);
      create temp table better_auth_users(id text,email text);
      create temp table integration_api_keys(public_id text,name text,owner_user_id text,created_by text);
      create temp table mcp_activation_events(actor_id text,session_id text,surface text,occurred_at timestamptz default now());
      create temp table mcp_tool_invocation_events(actor_id text,session_id text,surface text,occurred_at timestamptz default now(),tool_name text,client_name text,is_canary boolean default false);
      create temp table product_analytics_events(user_id uuid,is_staff boolean default false,is_bot boolean default false);
      create temp table scan_requests(requested_by jsonb,requested_url text);
      create temp table pulse_requests(requested_by jsonb);
      create temp table scans(submitted_by_user_id uuid);
      insert into users values ('00000000-0000-4000-8000-000000000001','customer@example.com'),('00000000-0000-4000-8000-000000000002','bmasek@gmail.com');
      insert into product_analytics_events default values;
      insert into integration_api_keys values ('daemon','Production scanning daemon',null,null),('staff','Normal key','00000000-0000-4000-8000-000000000002',null);`);
    await db.query(readFileSync("packages/db/migrations/0200_admin_activity_provenance.sql","utf8").replaceAll("public.","pg_temp."));
    const classify = async (e: object) => (await db.query("select pg_temp.classify_admin_activity_v1($1::jsonb) as value", [JSON.stringify(e)])).rows[0].value;
    assert.equal((await classify({client_name:"internal-probe"})).class,"unknown");
    assert.equal((await classify({source:"openai",source_attribution:"self_declared_client"})).class,"unknown");
    assert.equal((await classify({source:"openai",source_attribution:"verified_network"})).class,"external");
    assert.equal((await classify({requested_by:{apiKeyId:"daemon"}})).class,"automation");
    assert.equal((await classify({requested_by:{apiKeyId:"staff"}})).class,"internal");
    assert.equal((await classify({is_canary:true})).class,"internal");
    assert.equal((await classify({user_id:"00000000-0000-4000-8000-000000000002"})).class,"internal");
    const session="a".repeat(24);
    await db.query("insert into mcp_activation_events(session_id,surface,authenticated_user_id) values ($1,'mcp_authenticated','00000000-0000-4000-8000-000000000001')",[session]);
    await db.query("insert into mcp_tool_invocation_events(session_id,surface,tool_name,client_name) values ($1,'mcp_authenticated','certscore_get_connection_status','probe')",[session]);
    const invocation=(await db.query("select activity_traffic from mcp_tool_invocation_events")).rows[0].activity_traffic;
    assert.deepEqual(invocation,{version:1,class:"external",basis:"retained_session_provenance"});
    assert.equal((await classify({tool_name:"test",session_id:session,surface:"mcp_light",occurred_at:new Date().toISOString()})).class,"unknown");
    assert.equal((await classify({tool_name:"test",session_id:session,actor_id:"different",surface:"mcp_authenticated",occurred_at:new Date().toISOString()})).class,"unknown");
    assert.equal((await db.query("select activity_traffic->>'class' as value from product_analytics_events")).rows[0].value,"unknown");
    await db.query("insert into product_analytics_events(user_id,mcp_session_id) values ('00000000-0000-4000-8000-000000000001',$1)",[session]);
    assert.equal((await db.query("select mcp_session_id from product_analytics_events where user_id is not null")).rows[0].mcp_session_id,session);
    await assert.rejects(db.query("insert into product_analytics_events(mcp_session_id) values ('raw session')"));
  } finally { await db.query("rollback"); await db.end(); }
});
