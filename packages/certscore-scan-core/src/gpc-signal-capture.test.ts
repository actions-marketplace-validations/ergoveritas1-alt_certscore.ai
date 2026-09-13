import assert from "node:assert/strict";
import { test } from "node:test";
import type { BrowserContext, Page } from "playwright";
import { createGpcSignalCapture } from "./gpc-signal-capture.js";

// Deterministically change the inventory while the existing evaluations are
// outstanding. No timers, network requests, or browser startup are needed.
function fixture(enabled: boolean) {
  let evaluations = 0;
  const frame = (url: string) => ({
    currentUrl: url,
    url() { return this.currentUrl; },
    async evaluate() {
      evaluations++;
      return { url: this.currentUrl, timeOrigin: 1000, value: enabled };
    },
  });
  const main = frame("https://example.test/"), child = frame("https://child.test/");
  let current = [main, child];
  const page = { on() {}, frames: () => [...current], mainFrame: () => main, url: () => main.url() };
  const capture = createGpcSignalCapture({ context: { on() {} } as unknown as BrowserContext,
    page: page as unknown as Page, enabled, scanStartedAtMs: 1000, internalBudgetMs: 5000 });
  return { capture, main, child, frame, setFrames: (frames: typeof current) => { current = frames; }, evaluations: () => evaluations };
}

for (const enabled of [false, true]) {
  for (const change of ["stable", "reordered", "attached", "detached", "replaced", "url"] as const) {
    test(`signal inventory ${change} is explicit with GPC ${enabled}`, async () => {
      const f = fixture(enabled);
      const pending = f.capture.snapshot();
      if (change === "reordered") f.setFrames([f.child, f.main]);
      if (change === "attached") f.setFrames([f.main, f.child, f.frame("https://new.test/")]);
      if (change === "detached") f.setFrames([f.main]);
      if (change === "replaced") f.setFrames([f.main, f.frame(f.child.url())]);
      if (change === "url") f.child.currentUrl = "https://child.test/next";
      const proof = await pending;
      assert.ok(proof);
      assert.equal(f.evaluations(), 2, "do not retry or sample newly attached frames");
      assert.equal(proof.frameCount, 2, "retain the original sampled inventory");
      assert.ok(proof.frames.every(frame => frame.navigatorValue === enabled));
      const reasons = change === "attached" ? ["frame_attached_during_readback"]
        : change === "detached" ? ["frame_detached_during_readback"]
        : change === "replaced" ? ["frame_attached_during_readback", "frame_detached_during_readback"]
        : change === "url" ? ["frame_url_changed_during_readback"] : [];
      assert.deepEqual(proof.limitationKeys, reasons.length ? ["frames_changed_during_readback", ...reasons] : []);
    });
  }
}
