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

test('rapid timeout retains the stalled probe stage without inventing inventory', async () => {
  const page = { evaluate: () => new Promise(() => {}), url: () => 'https://example.test/' };
  const result = await readRapidFirstLayerConsentUiObservation(page as any, Date.now(), 100);
  assert.ok(result.basis.includes('inventory:rapid_timeout_stage:main_inventory'));
  assert.deepEqual(result.captureDiagnostics?.completedChannels, []);
  assert.deepEqual(result.captureDiagnostics?.timedOutChannels, ['dom_inventory']);
});


test('rapid inventory is one self-contained main-document call despite a stale page probe', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<main>No consent surface</main>');
    await page.evaluate(() => { (window as any).__certscoreRapidConsentInventory = () => { throw new Error('stale probe'); }; });
    const evaluate = page.evaluate.bind(page);
    let calls = 0;
    page.evaluate = ((...args: any[]) => { calls++; return (evaluate as Function)(...args); }) as typeof page.evaluate;
    const result = await readRapidFirstLayerConsentUiObservation(page, Date.now(), 1500);
    assert.equal(calls, 1);
    assert.equal(result.inventoryOutcome, 'complete_empty');
    assert.ok(result.captureDiagnostics?.completedChannels.includes('dom_inventory'));
  } finally { await browser.close(); }
});
