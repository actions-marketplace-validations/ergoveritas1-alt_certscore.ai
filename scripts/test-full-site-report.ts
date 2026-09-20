process.env.CERTSCORE_FULL_SITE_INTERNAL_ENABLED = "1";
/** Local-only integration harness. Run after scheduler.test.ts against its disposable database. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import {
  canUseFullSite,
  compactCrawlObservation,
  fullSitePolicy,
  FULL_SITE_CONTRACT,
  FULL_SITE_CONDITION,
  type CrawlOccurrence,
} from "../packages/shared/src/full-site-crawl";

async function main() {
  const databaseUrl = process.env.FULL_SITE_TEST_DATABASE_URL;
  assert.ok(databaseUrl);
  const url = new URL(databaseUrl);
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.pathname, "/full_site_test");
  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_READ_URL = databaseUrl;
  process.env.DATABASE_SSL_MODE = "disable";
  process.env.DB_QUERY_LOG_ENABLED = "false";
  const db = await import("../packages/db/src/index");
  const { loadFullSiteReport, loadFullSiteExport } = await import(
    "../apps/web/server/scans/full-site-report"
  );
  const scanId = randomUUID(),
    userId = randomUUID(),
    organizationId = randomUUID(),
    configurationHash = "a".repeat(64);
  const policy = fullSitePolicy(),
    requested = { maxPages: 250, concurrency: 3, waitSeconds: 5 },
    date = "2026-09-06T12:00:00.000Z";
  const row = (
    kind: CrawlOccurrence["kind"],
    identity: string,
    purpose = "unknown",
  ): CrawlOccurrence => ({
    kind,
    identity,
    id: identity,
    label: identity,
    vendor: "Fixture vendor",
    serviceId: kind === "service" ? identity : null,
    domain: "example.test",
    purpose,
    resourceType: kind,
    relationship: "first_party",
    assessment: "Not assessed",
    confidence: "unknown",
    firstSeenMs: 100,
    eventCount: 1,
    evidenceRefs: [identity],
    details: kind === "cookie" ? { persistence: "session" } : {},
  });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined,
    server: ReturnType<typeof createServer> | undefined;
  try {
    // The report also reads the homepage policy projection; this fixture has none.
    await db.query(`create table if not exists scan_snapshots (
      scan_id uuid primary key references scans(id) on delete cascade,
      report_projection_payload jsonb, report_projection_payload_sha256 text,
      report_projection_payload_size_bytes integer, report_projection_status text,
      report_projection_version text, report_projection_computed_at timestamptz
    )`);
    await db.query(`insert into users(id) values($1)`, [userId]);
    await db.query(
      `insert into organization_members values($1,$2,'advanced')`,
      [userId, organizationId],
    );
    await db.query(
      `insert into scans(id,organization_id,status,scan_config_json) values($1,$2,'completed',$3)`,
      [
        scanId,
        organizationId,
        { fullSite: true, crawlOptions: requested, hostname: "example.test" },
      ],
    );
    await db.withWriteTransaction((client) =>
      db.insertFullSiteCrawl(client, {
        scanId,
        userId,
        requested,
        policy,
        region: "eu-west-1",
        url: "https://example.test/",
        siteKey: "example.test",
      }),
    );
    await db.query(
      `update full_site_crawls set status='running',configuration_hash=$2,crawl_started_at=$3,homepage_duration_ms=30000,peak_workers=2 where scan_id=$1`,
      [scanId, configurationHash, date],
    );
    const [home] = await db.loadFullSitePages(scanId);
    assert.ok(home);
    let contactId = "";
    for (let i = 0; i < 201; i++) {
      const id = i === 0 ? home.id : randomUUID(),
        target =
          i === 0
            ? "https://example.test/"
            : `https://example.test/${i === 1 ? "contact" : `pages/${i}`}?lang=private-query-value`;
      if (i === 1) contactId = id;
      const status =
        i === 200 ? "blocked" : i === 199 ? "partial" : "completed";
      const occurrences =
        status === "blocked"
          ? []
          : [
              row("service", "Shared analytics", "analytics"),
              row(
                "cookie",
                "scope-bound cookie",
                i % 2 ? "analytics" : "functional",
              ),
              row("request", "safe request endpoint"),
              ...(i === 1
                ? [
                    row("service", "Contact map", "functional"),
                    row("embed", "Contact map frame", "functional"),
                  ]
                : []),
            ];
      const observation = {
        contractVersion: FULL_SITE_CONTRACT,
        parentScanId: scanId,
        pageJobId: id,
        attemptId: randomUUID(),
        executionProfile:
          i === 0
            ? ("homepage_baseline" as const)
            : ("inventory_only" as const),
        condition: FULL_SITE_CONDITION,
        configurationHash,
        requestedUrl: target.split("?")[0]!,
        finalUrl: null,
        startedAt: date,
        completedAt: "2026-09-06T12:00:10.000Z",
        status,
        limitations: status === "completed" ? [] : ["collection_limited"],
        sourceHash: "b".repeat(64),
        occurrences,
        links: [],
        redirects: [],
        httpStatus: status === "blocked" ? 429 : 200,
        retryAfterSeconds: null,
        failureKind: null,
      };
      if (i > 0)
        await db.query(
          `insert into full_site_pages(id,scan_id,target_url,source,selection_reason,section,status,scheduled) values($1,$2,$3,'fixture','Breadth fixture','pages',$4,true)`,
          [id, scanId, target, status],
        );
      await db.query(
        `update full_site_pages set status=$2,observation_json=$3,compact_json=$4,attempt_count=1 where id=$1`,
        [id, status, observation, compactCrawlObservation(observation)],
      );
    }
    await db.query(`update full_site_crawls set robots_json=$2 where scan_id=$1`, [scanId, {rules:[{allow:false,path:"/private/"}],crawlDelaySeconds:0,sitemaps:[]}]);
    const report = await loadFullSiteReport(scanId);
    assert.ok(report);
    assert.match(report.summary.state.robotsRestriction!, /Only permitted URLs/);
    assert.equal(report.summary.totals.services, 2);
    assert.equal(report.summary.totals.cookies, 1);
    assert.equal(report.summary.totals.requestEvents, 200);
    assert.equal(report.summary.totals.additionalServices, 1);
    assert.equal(report.pages.rows.length, 50);
    assert.equal(report.pageChoices.length, 201);
    assert.equal(report.evidence, null);
    assert.ok(!JSON.stringify(report).includes("private-query-value"));
    const cookie = await loadFullSiteReport(
      scanId,
      new URLSearchParams({ kind: "cookie", purpose: "mixed" }),
    );
    assert.equal(cookie?.resources.total, 1);
    assert.equal(cookie?.charts.cookies[0]?.label, "mixed");
    assert.equal(
      (
        await loadFullSiteReport(
          scanId,
          new URLSearchParams({ kind: "cookie", persistence: "session" }),
        )
      )?.resources.total,
      1,
    );
    const detail = await loadFullSiteReport(
      scanId,
      new URLSearchParams({
        resource: "service:Contact map",
        detailPage: contactId,
      }),
    );
    assert.equal(detail?.selectedResource?.pageIds[0], contactId);
    assert.equal(detail?.evidence?.total, 1);
    const exported = await loadFullSiteExport(scanId);
    assert.ok(exported);
    assert.deepEqual(exported.summary.totals, report.summary.totals);
    assert.equal(exported.pages.length, 201);
    assert.ok(
      Buffer.byteLength(JSON.stringify(report)) < 150000,
      "Initial response remains bounded with 201 page targets",
    );
    const bundle = await build({
      stdin: {
        contents: `import React from 'react';import{createRoot}from'react-dom/client';import{FullSiteControls}from'./apps/web/components/scans/full-site-controls';import{FullSiteWorkspace}from'./apps/web/components/scans/full-site-workspace';function Fixture(){return <><form onSubmit={e=>{e.preventDefault();window.submitted=Object.fromEntries(new FormData(e.currentTarget))}}><FullSiteControls/><button>Submit fixture</button></form><FullSiteWorkspace scanId="${scanId}" requested={${JSON.stringify(requested)}}><p>Homepage audit fixture score: 87</p></FullSiteWorkspace></>}createRoot(document.getElementById('root')).render(<Fixture/>);`,
        resolveDir: process.cwd(),
        loader: "tsx",
      },
      bundle: true,
      write: false,
      platform: "browser",
      jsx: "automatic",
      tsconfig: "tsconfig.base.json",
      define: { "process.env.NODE_ENV": "'development'" },
    });
    const css = await postcss([
      tailwindcss({
        content: ["apps/web/components/scans/*.tsx"],
        theme: {},
        plugins: [],
      }),
    ]).process("@tailwind base;@tailwind components;@tailwind utilities;", {
      from: undefined,
    });
    let role = "advanced";
    let calls = 0;
    server = createServer(async (req, res) => {
      const requestUrl = new URL(req.url ?? "/", "http://localhost");
      try {
        if (requestUrl.pathname === "/api/full-scan/options") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ allowed: canUseFullSite(role), policy }));
        } else if (requestUrl.pathname.startsWith("/api/scans/")) {
          calls++;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify(
              await loadFullSiteReport(scanId, requestUrl.searchParams),
            ),
          );
        } else if (requestUrl.pathname === "/fixture.js") {
          res.setHeader("Content-Type", "text/javascript");
          res.end(bundle.outputFiles[0]!.text);
        } else
          res.end(
            `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.css}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`,
          );
      } catch (error) {
        res.statusCode = 500;
        res.end(String(error));
      }
    });
    await new Promise<void>((resolve) =>
      server!.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });
    page.setDefaultTimeout(10000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const fixtureUrl = `http://127.0.0.1:${address.port}`;
    await page.goto(fixtureUrl);
    if (!process.argv.includes("--discovery-only")) {
    await page
      .getByRole("switch", { name: "Full site", exact: true })
      .waitFor();
    assert.equal(
      await page.getByLabel("Max pages", { exact: true }).count(),
      0,
    );
    await page
      .getByRole("switch", { name: "Full site", exact: true })
      .press("Space");
    assert.equal(
      await page.getByLabel("Max pages", { exact: true }).inputValue(),
      "10",
    );
    assert.equal(await page.getByLabel("Concurrency", { exact: true }).inputValue(), "4");
    assert.equal(await page.getByLabel("Concurrency", { exact: true }).getAttribute("max"), "12");
    await page.getByText(/robots.txt restricts crawl coverage/).waitFor();
    await page.getByLabel("Max pages", { exact: true }).fill("0");
    assert.equal(
      await page
        .getByLabel("Max pages", { exact: true })
        .getAttribute("aria-invalid"),
      "true",
    );
    await page.getByLabel("Max pages", { exact: true }).fill("200");
    await page
      .getByRole("switch", { name: "Full site", exact: true })
      .press("Space");
    await page
      .getByRole("button", { name: "Submit fixture", exact: true })
      .click();
    assert.deepEqual(await page.evaluate("window.submitted"), {});
    await page.getByRole("button", { name: "services", exact: true }).click();
    const expansion = page.getByRole("button", { name: /^Expand / }).first();
    await expansion.click();
    assert.equal(await page.getByRole("button", { name: /^Collapse (?!all$)/ }).first().getAttribute("aria-expanded"), "true");
    await page.getByLabel("Relationship scenario").selectOption("post_accept");
    const before = calls;
    await page.waitForFunction(() => document.querySelector('[aria-label="Relationship scenario"]')?.value === "post_accept");
    await page.screenshot({ path: "/tmp/certscore-full-site-report-desktop.png", fullPage: true });
    await page.waitForResponse(response => response.url().includes("/full-site?"), { timeout: 30000 });
    assert.ok(calls > before);
    assert.equal(await page.getByLabel("Relationship scenario").inputValue(), "post_accept");
    await page.getByRole("button", { name: "resources", exact: true }).click();
    await page.getByRole("button", { name: "View JSON evidence for scope-bound cookie", exact: true }).click();
    await page.getByRole("dialog", { name: "JSON evidence for scope-bound cookie", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Homepage report", exact: true }).click();
    await page.getByText("Homepage audit fixture score: 87").waitFor();
    await page.getByRole("button", { name: "Full site report", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "resources", exact: true }).click();
    await page.screenshot({
      path: "/tmp/certscore-full-site-report-mobile.png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
      false,
      "Mobile document must not overflow horizontally",
    );
    }
    // Operational sitemap diagnostics must survive the DB -> report -> UI path.
    const diagnostics = [{stage: "sitemap", path: "/sitemap.xml", status: 301, reason: "redirect_not_followed"}];
    await db.query(`update full_site_crawls set status='completed',completed_at=now(),stop_reason='sitemap_discovery_limited',
      policy_json=jsonb_set(policy_json,'{discoveryDiagnostics}',$2::jsonb) where scan_id=$1`, [scanId, JSON.stringify(diagnostics)]);
    const discoveryLimited = await loadFullSiteReport(scanId);
    assert.deepEqual(discoveryLimited?.summary.state.discoveryDiagnostics, diagnostics);
    assert.deepEqual(discoveryLimited?.summary.totals, report.summary.totals, "Coverage diagnostics must not alter evidence inventories");
    await page.goto(fixtureUrl);
    await page.getByText(/Sitemap discovery was limited/).waitFor();
    assert.equal(await page.getByText("Full-site scan couldn’t finish", {exact:true}).count(), 0);
    await page.screenshot({path: "/tmp/certscore-sitemap-discovery-limited.png", fullPage: true});

    // Historical incident: retained homepage plus an unvisited discovery queue.
    const unvisitedId = randomUUID();
    await db.query(`insert into full_site_pages(id,scan_id,target_url,source,selection_reason,section,status,limitation)
      values($1,$2,'https://example.test/unvisited','homepage_rendered_link','Fixture','/','cancelled','discovery_unavailable_or_blocked')`, [unvisitedId, scanId]);
    await db.query(`update full_site_pages set status='cancelled',limitation='discovery_unavailable_or_blocked',
      compact_json=null,observation_json=null,scheduled=false where scan_id=$1 and source<>'homepage'`, [scanId]);
    await db.query(`update full_site_crawls set status='stopped',stop_reason='discovery_unavailable_or_blocked',
      discovery_complete=false,crawl_started_at=null,peak_workers=0,policy_json=policy_json-'discoveryDiagnostics' where scan_id=$1`, [scanId]);
    const historical = await loadFullSiteReport(scanId, new URLSearchParams(), true);
    assert.equal(historical?.pages.rows.find(p => p.id === unvisitedId)?.status, "excluded");
    assert.equal(historical?.pages.rows.find(p => p.id === unvisitedId)?.limitation, "not_scanned_discovery_unavailable");
    assert.equal(historical?.score, null, "Missing canonical homepage projection must still fail closed");
    await page.goto(fixtureUrl);
    await page.getByText("Additional crawling unavailable", {exact:true}).waitFor();
    await page.getByText(/Captured page results are retained below/).waitFor();
    assert.equal(await page.getByText(/scanner stopped before it could produce/).count(), 0);
    await page.screenshot({path: "/tmp/certscore-historical-discovery-limited.png", fullPage: true});

    // A checksum-verified historical canonical projection remains the score source.
    const { buildPersistedScanReportProjection, SCAN_REPORT_PROJECTION_VERSION } = await import("../apps/web/server/scans/scan-report-projection-contract");
    const { deriveGdprEprivacyCoverageChecklist } = await import("../apps/web/lib/scans/gdpr-eprivacy-coverage-checklist");
    const checklistRows = deriveGdprEprivacyCoverageChecklist({scanCompleted: true, coverageLimited: false, unifiedFindings: []});
    const persisted = buildPersistedScanReportProjection({
      scan: {id: scanId, status: "completed", completedAt: date}, snapshot: null, runtimeArtifacts: {}, events: [],
    } as any, {canonicalReportProjection: {
      artifactVersion: "persisted-canonical-report-projection-v6", checklistRows,
      derivedContext: {}, evidenceIndex: {}, globalUnifiedFindings: [], ownerUnifiedFindingIds: [],
      ownerUnifiedFindings: [], normalizedConcerns: [], topFindingIds: [], legacyScoreAssessmentInput: {scanId},
    } as any});
    await db.query(`insert into scan_snapshots(scan_id,report_projection_payload,report_projection_payload_sha256,
      report_projection_payload_size_bytes,report_projection_status,report_projection_version,report_projection_computed_at)
      values($1,$2,$3,$4,'ready',$5,now())`, [scanId, persisted.payload, persisted.sha256, persisted.sizeBytes, SCAN_REPORT_PROJECTION_VERSION]);
    const retained = await loadFullSiteReport(scanId);
    assert.ok(retained?.score);
    assert.equal(typeof retained.score.value, "number");
    assert.equal(retained.score.scoredPages, 1);
    assert.equal(retained.score.limitedPages, 0, "Unvisited pages are coverage limits, not assessed evidence");
    await page.goto(fixtureUrl);
    await page.getByText("Starting page completed · Additional crawling unavailable", {exact:true}).waitFor();
    await page.screenshot({path: "/tmp/certscore-historical-discovery-retained-score.png", fullPage: true});
    await db.query(`update full_site_crawls set status='completed' where scan_id=$1`, [scanId]);
    const completedWithSameEvidence = await loadFullSiteReport(scanId);
    assert.equal(completedWithSameEvidence?.score?.value, retained.score.value, "Discovery status must not change canonical deductions");
    await db.query(`update scan_snapshots set report_projection_payload_sha256=$2 where scan_id=$1`, [scanId, "0".repeat(64)]);
    assert.equal((await loadFullSiteReport(scanId))?.score, null, "Unverifiable projection must never retain a score through cache");

    for (role of ["admin", "member", "anonymous"]) {
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("full-scan/options")),
        page.goto(fixtureUrl),
      ]);
      await page.waitForTimeout(100);
      assert.equal(
        await page
          .getByRole("switch", { name: "Full site", exact: true })
          .count(),
        role === "admin" ? 1 : 0,
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      process.argv.includes("--discovery-only")
        ? "PASS: PostgreSQL report aggregation, 201-page evidence, discovery diagnostics, historical unscanned coverage, canonical retained-score parity, checksum rejection, browser failure/limited states and role visibility."
        : "PASS: real PostgreSQL report aggregation, filters, export parity, lazy evidence, 201 pages, role visibility, form validation, service expansion and live UI state, desktop/mobile layout, discovery limitations and retained scoring.",
    );
  } finally {
    await browser?.close();
    server?.closeAllConnections();
    if (server)
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    await db.query(`delete from scans where id=$1`, [scanId]);
    await db.query(`delete from organization_members where user_id=$1`, [
      userId,
    ]);
    await db.query(`delete from users where id=$1`, [userId]);
    await db.getWritePool().end();
    await db.getReadPool().end();
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
