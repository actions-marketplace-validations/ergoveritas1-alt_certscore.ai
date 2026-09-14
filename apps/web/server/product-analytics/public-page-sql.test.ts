import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import pg from "pg";
import { issuePublicPageToken } from "./public-page-token";
import { pageViewPredicateSql, PUBLIC_PAGE_UPSERT_SQL } from "./public-page-sql";

const databaseUrl = process.env.PUBLIC_PAGE_TEST_DATABASE_URL;
test("real SQL merges both delivery orders and retries without retaining identity or downgrading confirmation", { skip: !databaseUrl }, async () => {
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
    const sql = PUBLIC_PAGE_UPSERT_SQL.replaceAll("public.", "pg_temp.");
    for (const order of [[false, true, true, false], [true, false, true, false]]) {
      const { identity } = issuePublicPageToken("/developers", "a-test-secret-that-is-at-least-32-characters");
      for (const confirmed of order) await db.query(sql, [identity.id, identity.requestedAt, identity.route, confirmed, false]);
      const { rows } = await db.query("select * from pg_temp.product_analytics_events where event_id = $1", [identity.id]);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].feature, "public_page_browser_confirmed");
      assert.ok(rows[0].browser_confirmed_at);
      for (const field of ["user_id", "actor_id", "session_id", "organization_id", "scan_id", "campaign_source", "referring_domain"]) assert.equal(rows[0][field], null);
      await db.query(sql, [identity.id, identity.requestedAt, "/wrong", true, false]);
      assert.equal((await db.query("select normalized_route from pg_temp.product_analytics_events where event_id = $1", [identity.id])).rows[0].normalized_route, "/developers");
    }
    const { identity } = issuePublicPageToken("/trust", "a-test-secret-that-is-at-least-32-characters");
    await db.query(sql, [identity.id, identity.requestedAt, identity.route, false, true]);
    const row = (await db.query("select * from pg_temp.product_analytics_events where event_id = $1", [identity.id])).rows[0];
    assert.equal(row.feature, "public_page_request");
    assert.equal(row.browser_confirmed_at, null);
    assert.equal(row.is_bot, true);
    const totals = (await db.query(`select count(*) as requests, count(*) filter (where ${pageViewPredicateSql()}) as views from pg_temp.product_analytics_events`)).rows[0];
    assert.deepEqual(totals, { requests: "3", views: "2" });
    assert.equal((await db.query(`select count(*) from pg_temp.product_analytics_events events where ${pageViewPredicateSql("events.")}`)).rows[0].count, "2");
    await db.query("rollback");
  } finally { await db.end(); }
});
