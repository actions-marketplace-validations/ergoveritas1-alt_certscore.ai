import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { AUTHENTICATED_PAGE_UPSERT_SQL } from "./authenticated-page-sql";
import { pageViewPredicateSql } from "./public-page-sql";

const databaseUrl = process.env.PUBLIC_PAGE_TEST_DATABASE_URL;
test("authenticated SQL deduplicates arrival orders, binds account/path, and excludes unconfirmed legacy requests from views", { skip: !databaseUrl }, async () => {
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl!).hostname));
  const db = new pg.Client({ connectionString: databaseUrl });
  await db.connect();
  try {
    await db.query(`begin;
      create temp table users(id uuid primary key);
      create temp table organizations(id uuid primary key);
      create temp table scans(id uuid primary key);`);
    const migration = readFileSync("packages/db/migrations/0184_product_analytics.sql", "utf8")
      .replace("create table if not exists public.product_analytics_events", "create temp table product_analytics_events")
      .replaceAll("public.", "pg_temp.");
    await db.query(migration);
    await db.query(readFileSync("packages/db/migrations/0185_operational_event_consent.sql", "utf8").replaceAll("public.", "pg_temp."));
    await db.query(readFileSync("packages/db/migrations/0201_public_page_requests.sql", "utf8").replaceAll("public.", "pg_temp."));
    await db.query(readFileSync("packages/db/migrations/0202_authenticated_page_context.sql", "utf8").replaceAll("public.", "pg_temp."));
    const userId = randomUUID(), otherUser = randomUUID();
    await db.query("insert into pg_temp.users values($1),($2)", [userId, otherUser]);
    const sql = AUTHENTICATED_PAGE_UPSERT_SQL.replaceAll("public.", "pg_temp.");
    for (const order of [[false,true,true,false], [true,false,true,false]]) {
      const id = randomUUID(), now = Date.now();
      const args = (confirmed:boolean, user=userId, path="/app") => [id,now,path,path,user,null,null,confirmed,false,"chrome","macos","desktop",false,confirmed?"en":null,confirmed?"lg":null,"US"];
      for (const confirmed of order) await db.query(sql,args(confirmed));
      const row = (await db.query("select * from pg_temp.product_analytics_events where event_id=$1",[id])).rows[0];
      assert.equal(row.feature,"authenticated_page_browser_confirmed");
      assert.equal(row.user_id,userId);
      assert.equal(row.page_path,"/app");
      assert.equal(row.language,"en");
      assert.equal(row.viewport_band,"lg");
      assert.ok(row.browser_confirmed_at);
      assert.equal(row.session_id,null);
      assert.equal(row.actor_id,null);
      assert.equal((await db.query(sql,args(true,otherUser))).rowCount,0);
      assert.equal((await db.query(sql,args(true,userId,"/app/admin"))).rowCount,0);
    }
    const id = randomUUID();
    await db.query(sql,[id,Date.now(),"/app","/app",userId,null,null,false,false,"safari","ios","mobile",false,null,null,null]);
    const legacyId = randomUUID();
    await db.query("insert into pg_temp.product_analytics_events(event_id,event_name,category,feature,outcome,normalized_route,consent_state,browser_family,os_family,device_class) values($1,'page_viewed','navigation','server_route','observed','/app','operational','server','server','unknown')",[legacyId]);
    const counts = (await db.query(`select count(*) as events,count(*) filter(where ${pageViewPredicateSql()}) as views from pg_temp.product_analytics_events`)).rows[0];
    assert.deepEqual(counts,{events:"4",views:"2"});
    await db.query("rollback");
  } finally { await db.end(); }
});
