import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import { createArtifactWriter } from "./artifact-writer";
import { preConsentRuntimeScanner } from "./scanners/pre-consent-runtime-scanner";
import { startStaticFixtureServer } from "./test-fixtures/static-server";

for (const count of [3, 251]) {
  test(`runtime form observation remains passive with ${count} candidates`, async () => {
    const server = await startStaticFixtureServer();
    const directory = await mkdtemp(path.join(tmpdir(), "certscore-passive-forms-"));
    const browser = await chromium.launch({ headless: true });
    const interactions: string[] = [];
    const submissions: string[] = [];
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (...args) => {
      const context = await newContext(...args);
      await context.exposeBinding("recordFormInteraction", (_source, kind: string) => { interactions.push(kind); });
      await context.addInitScript(() => {
        const record = (kind: string) => { void (window as any).recordFormInteraction(kind); };
        for (const kind of ["submit", "input", "change", "click", "keydown", "focusin"]) document.addEventListener(kind, () => record(kind), true);
        for (const method of ["submit", "requestSubmit"] as const) HTMLFormElement.prototype[method] = function () { record(method); };
        for (const prototype of [HTMLInputElement.prototype, HTMLTextAreaElement.prototype, HTMLSelectElement.prototype]) {
          const descriptor = Object.getOwnPropertyDescriptor(prototype, "value")!;
          Object.defineProperty(prototype, "value", { ...descriptor, set(value) { record("value-set"); descriptor.set!.call(this, value); } });
        }
      });
      context.on("request", request => { if (request.url().includes("submission-tripwire")) submissions.push(request.url()); });
      return context;
    };
    try {
      const url = server.urlFor("branded-login-page");
      const controls = Array.from({ length: count }, (_, i) => `<label>Field ${i}<input type="${i === 1 ? "password" : "text"}" value="private-value-${i}"></label>`).join("");
      let values: string[] = [];
      const result = await preConsentRuntimeScanner({
        url, normalizedUrl: url, scanStartedAtMs: Date.now(), internalBudgetMs: 20_000,
        artifactWriter: await createArtifactWriter(directory), browser, captureScope: "runtime_evidence",
        waitMode: "fast", screenshotMode: "never",
        routeFulfillers: [{ urlPattern: new RegExp(`^${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), contentType: "text/html", body: `<html><body><h1>Account details</h1><p>Review your profile and contact information.</p><form action="/submission-tripwire" method="post">${controls}<button type="submit">Submit</button><input type="submit" value="Send"><button type="button" onclick="this.form.requestSubmit()">Save</button></form></body></html>` }],
        formSnapshotReviewer: async () => ({ safeForDisplay: true }),
        onInventoryPage: async page => { values = await page.locator('input:not([type="submit"])').evaluateAll(inputs => inputs.map(input => (input as HTMLInputElement).value)); },
      });
      assert.equal(result.moduleRun.status, "completed", result.moduleRun.errors.join("; "));
      assert.deepEqual(interactions, [], "inventory and image capture must not fill, focus, click or submit controls");
      assert.deepEqual(submissions, []);
      assert.deepEqual(values, Array.from({ length: count }, (_, i) => `private-value-${i}`));
      const inventory = result.collectionSurfaceInventory!;
      assert.ok(inventory);
      assert.equal(inventory.coverage.interactionMode, "none");
      assert.doesNotMatch(JSON.stringify(inventory), /private-value-|submission-tripwire/);
      if (count === 251) {
        assert.equal(inventory.coverage.inspectedFieldCandidateCount, 250);
        assert.equal(inventory.coverage.candidateScanTruncated, true);
        assert.equal(inventory.coverage.status, "limited");
        assert.ok(inventory.coverage.reasonCodes.includes("candidate_scan_truncated"));
        assert.equal(inventory.forms[0]?.fieldsTruncated, true);
      } else {
        assert.equal(inventory.coverage.status, "complete");
        assert.equal(inventory.forms[0]?.retainedFieldCount, 3);
        assert.equal(result.collectionSurfaceSnapshots?.[0]?.status, "available");
      }
    } finally {
      await browser.close(); await server.close(); await rm(directory, { recursive: true, force: true });
    }
  });
}
