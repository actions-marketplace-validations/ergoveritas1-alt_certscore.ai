import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import { chromiumLaunchOptions } from "./playwright-runtime";
import { createArtifactWriter } from "./artifact-writer";
import { preConsentRuntimeScanner } from "./scanners/pre-consent-runtime-scanner";
import { gpcDocumentHash } from "./gpc-signal-capture";

test("GPC retains real requests and one terminal probe through the existing sparse-page wait", async t => {
  for (const changedDocument of [false, true]) await t.test(changedDocument ? "URL changes remain limited" : "stable document retains late evidence", async () => {
    const browser = await chromium.launch(chromiumLaunchOptions({ headless: true }));
    const outDir = await mkdtemp(path.join(tmpdir(), "gpc-sparse-finalization-"));
    let waits = 0, pings = 0;
    const createContext = browser.newContext.bind(browser);
    browser.newContext = async options => {
      const context = await createContext(options);
      context.on("page", page => {
        const wait = page.waitForTimeout.bind(page);
        page.waitForTimeout = async ms => {
          if (ms === 750) {
            waits++;
            // Trigger browser activity exactly when the existing confirmation
            // window begins, without depending on machine-speed timers.
            await page.evaluate(async changed => {
              if (changed) history.replaceState(null, "", "/changed");
              await fetch("/during-confirmation");
            }, changedDocument);
          }
          return wait(ms);
        };
        page.on("request", request => { if (request.url().endsWith("/terminal-ping")) pings++; });
      });
      return context;
    };
    const url = "https://gpc-sparse-finalization.test/";
    try {
      const result = await preConsentRuntimeScanner({
        browser, artifactWriter: await createArtifactWriter(outDir), captureScope: "runtime_evidence",
        globalPrivacyControlEnabled: true, gpcOptOutPrototype: { scanId: "gpc-sparse" },
        internalBudgetMs: 8000, normalizedUrl: url, url, scanStartedAtMs: Date.now(),
        screenshotMode: "never", waitMode: "fast", routeFulfillers: [{
          urlPattern: /^https:\/\/gpc-sparse-finalization\.test\/$/, contentType: "text/html",
          body: `<!doctype html><html><body>Loading<script>
            window.__gpp=(command,callback)=>{if(command==='ping'){
              fetch('/terminal-ping');callback({gppVersion:'1.1',cmpStatus:'loaded',signalStatus:'ready',applicableSections:[-1],sectionList:[]},true);
            }};</script></body></html>`,
        }, {
          urlPattern: /^https:\/\/gpc-sparse-finalization\.test\/(during-confirmation|terminal-ping)/,
          contentType: "text/plain", body: "retained",
        }],
      });
      assert.equal(result.moduleRun.status, "completed", result.moduleRun.errors.join("; "));
      assert.equal(waits, 1, "one already-required sparse-page window");
      assert.equal(pings, 1, "one terminal semantic probe");
      const session = result.gpcObservationSession;
      assert.ok(session);
      assert.ok(session.requests.some(r => r.urlSha256 === gpcDocumentHash(`${url}during-confirmation`) && r.secGpc === "1"));
      const timings = result.moduleRun.timingBreakdown!;
      assert.ok(timings.findIndex(x => x.label === "GPC observation finalization") > timings.findIndex(x => x.label === "no-go candidate confirmation wait"));
      assert.equal(session.terminal, changedDocument ? "incomplete" : "completed");
      assert.equal(session.finalization?.documentUnchanged, !changedDocument);
      if (changedDocument) assert.ok(session.limitationKeys.includes("terminal_document_unverified"));
      else assert.ok(session.captureEndedAtMs - session.mainDocument!.committedAtMs >= 250);
      assert.equal(result.gpcSignalObservation?.prototypeSessionSha256, createHash("sha256").update(JSON.stringify(session)).digest("hex"));
      t.diagnostic(JSON.stringify({ scenario: changedDocument ? "changed_document" : "stable_document", waits, pings,
        captureDurationMs: session.captureEndedAtMs - session.captureStartedAtMs,
        sessionBytes: Buffer.byteLength(JSON.stringify(session)),
        retainedLateRequestBytes: Buffer.byteLength(JSON.stringify(session.requests.filter(r => r.urlSha256 === gpcDocumentHash(`${url}during-confirmation`)))),
      }));
    } finally {
      await browser.close();
      await rm(outDir, { recursive: true, force: true });
    }
  });
});

test("GPC safely resets a failed HTTPS navigation before the existing HTTP fallback", async () => {
  let documents = 0;
  const server = createServer((request, response) => {
    if (request.headers["sec-fetch-dest"] === "document") {
      documents++;
      assert.equal(request.headers["sec-gpc"], "1");
    }
    response.setHeader("content-type", "text/html");
    response.end(`<!doctype html><html><body><h1>Public information</h1><p>${"Product and company information for visitors. ".repeat(30)}</p></body></html>`);
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const url = `https://127.0.0.1:${address.port}/`;
  const outDir = await mkdtemp(path.join(tmpdir(), "gpc-transport-recovery-"));
  try {
    const result = await preConsentRuntimeScanner({
      artifactWriter: await createArtifactWriter(outDir), captureScope: "runtime_evidence",
      globalPrivacyControlEnabled: true, gpcOptOutPrototype: { scanId: "gpc-transport" },
      internalBudgetMs: 8000, normalizedUrl: url, url, scanStartedAtMs: Date.now(),
      screenshotMode: "never", waitMode: "fast",
    });
    assert.equal(result.moduleRun.status, "completed", result.moduleRun.errors.join("; "));
    assert.equal(documents, 1, "only the already-configured HTTP candidate renders a page");
    assert.ok(result.moduleRun.recoveryDiagnostics?.modes.includes("transport_alternate_reset"));
    assert.ok(result.domSnapshots.some(s => s.url === url.replace("https:", "http:") && s.textExcerpt.includes("Public information")));
    assert.equal(result.gpcObservationSession?.terminal, "completed");
    assert.equal(result.gpcObservationSession?.mainDocument?.secGpc, "1");
    assert.equal(result.gpcObservationSession?.semanticObservation?.navigatorGpc, true);
  } finally {
    server.closeAllConnections(); server.close();
    await rm(outDir, { recursive: true, force: true });
  }
});
