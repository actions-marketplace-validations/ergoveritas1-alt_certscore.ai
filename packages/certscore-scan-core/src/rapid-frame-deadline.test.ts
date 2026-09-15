import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';
import { readRapidFirstLayerConsentUiObservation } from './scanners/pre-consent-runtime-scanner';

test('stalled child frames preserve completed main inventory and explicit frame coverage', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<main>No consent surface</main><iframe srcdoc="<p>Embedded content</p>"></iframe>');
    const frame = page.frames().find(f => f !== page.mainFrame())!;
    frame.evaluate = (() => new Promise(() => {})) as typeof frame.evaluate;
    const result = await readRapidFirstLayerConsentUiObservation(page, Date.now(), 1500);
    assert.ok(result.captureDiagnostics?.completedChannels.includes('dom_inventory'));
    assert.ok(result.inventoryDiagnostics?.blockingInaccessibleFrameCount! > 0);
    assert.notEqual(result.inventoryOutcome, 'complete_empty');
    assert.ok(!result.basis.includes('inventory:rapid_dom_timed_out'));
  } finally { await browser.close(); }
});
