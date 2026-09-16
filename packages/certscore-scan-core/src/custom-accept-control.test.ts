import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import test from "node:test";
import { chromium } from "playwright";
import { projectPostAcceptEvidenceForReport, postAcceptReportProjectionSchema } from "@certscore/contracts";
import { inspectCustomAcceptControl, sameCustomAcceptControlBinding } from "./custom-accept-control.js";
import { buildCanonicalPostAcceptActionRecipes } from "./post-accept-cmp-recipes.js";
import { runPostAcceptObserver } from "./post-accept-observer.js";

test("custom binding reads direct handlers, fails closed on delegated/transactional/composite controls and detects replacement", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.setContent('<section id="consent"><span id="choice" onclick="window.choice=true">Accept all</span></section>');
    const inspect = () => inspectCustomAcceptControl(page.locator('#choice'), '#consent', Date.now() + 500);
    const original = await inspect();
    assert.ok(original);
    assert.equal(original.kind, 'direct_onclick');
    assert.ok(!JSON.stringify(original).includes('window.choice'));
    assert.equal(await inspectCustomAcceptControl(page.locator('#choice'), '#consent', Date.now() + 500, 'reject all'), undefined);
    await page.locator('#choice').evaluate(el => (el as HTMLElement).onclick = () => { document.title = 'different'; });
    assert.equal(sameCustomAcceptControlBinding(await inspect(), original), false);
    await page.locator('#choice').evaluate(el => { (el as HTMLElement).onclick = null; el.parentElement!.onclick = () => {}; });
    assert.equal(await inspect(), undefined);
    for (const html of [
      '<form id="consent"><span id="choice" onclick="void 0">Accept all</span></form>',
      '<section id="consent"><span id="choice" onclick="void 0"><button>Accept all</button></span></section>',
      '<section id="consent"><span id="choice" aria-disabled="true" onclick="void 0">Accept all</span></section>',
      '<section id="consent"><span id="choice" contenteditable="true" onclick="void 0">Accept all</span></section>',
      '<section id="consent"></section><span id="choice" onclick="void 0">Accept all</span>',
    ]) {
      await page.setContent(html);
      assert.equal(await inspect(), undefined, html);
    }
    assert.equal(await inspectCustomAcceptControl(page.locator('#choice'), '#consent', Date.now() - 1), undefined);
  } finally { await browser.close(); }
});

test("canonical custom Accept path retains typed proof, one click and bounded capture across component variants", { timeout: 45000 }, async (t) => {
  let variant = 'span', clicks = 0;
  const server = createServer((request, response) => {
    if (request.url === '/clicked') { clicks++; response.writeHead(204).end(); return; }
    const tag = variant === 'div' ? 'div' : variant === 'element' ? 'consent-choice' : 'span';
    const label = variant === 'misleading' ? 'Accept and purchase' : 'Accept all';
    const handler = "window.performConsentChoice()";
    const control = `<${tag} id="choice" class="accept-button" style="display:block;width:240px;height:48px" ${variant === 'drift' ? 'onmouseover="this.onclick=function(){window.replaced=true}"' : ''} ${variant === 'conflict' ? 'aria-label="Reject all"' : ''} ${['delegated', 'pointer', 'property', 'mixed_unverified'].includes(variant) ? '' : `onclick="${handler}"`}>${label}</${tag}>`;
    const scope = variant === 'form' ? 'form' : 'section';
    const html = `<${scope} id="privacy-consent" role="dialog" aria-label="Cookie consent choices"><p>Choose whether to allow analytics and advertising cookies.</p>${control}${variant === 'duplicate' ? control.replace('id="choice"', 'id="other-choice"') : ''}${['mixed', 'mixed_unverified'].includes(variant) ? '<button onclick="window.performConsentChoice()">Accept all</button>' : ''}</${scope}>`;
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end(`<!doctype html><html lang="en"><body>${variant === 'shadow' ? '<consent-banner id="host"></consent-banner>' : html}
      <script>
      window.performConsentChoice=function(){fetch('/clicked');localStorage.setItem('custom_choice_receipt','clicked');};
      ${variant === 'shadow' ? `document.querySelector('#host').attachShadow({mode:'open'}).innerHTML=${JSON.stringify(html)};` : ''}
      ${variant === 'property' ? `document.querySelector('#choice').onclick=window.performConsentChoice;` : ''}
      ${variant === 'delegated' ? `document.querySelector('#privacy-consent').addEventListener('click',window.performConsentChoice);` : ''}
      </script></body></html>`);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const browser = await chromium.launch({ headless: true });
  const recipes = buildCanonicalPostAcceptActionRecipes();
  try {
    for (variant of ['span', 'property', 'div', 'element', 'shadow', 'delegated', 'pointer', 'form', 'duplicate', 'mixed', 'mixed_unverified', 'misleading', 'conflict', 'drift']) {
      clicks = 0;
      const packet = await runPostAcceptObserver({ browser, scanId: `custom-${variant}`,
        url: `http://127.0.0.1:${address.port}/`,
        interactionAuthorization: { authorizationId: 'loopback_local_lab', kind: 'loopback' },
        allowCanonicalAcceptDiscovery: true, actionSearchTimeoutMs: 1800, confirmationTimeoutMs: 100,
        observationWindowMs: 250, recipe: recipes[0]!, recipeCandidates: recipes, productionProjectable: true,
      });
      const positive = ['span', 'property', 'div', 'element', 'shadow'].includes(variant);
      assert.equal(clicks, positive ? 1 : 0, `${variant}: ${JSON.stringify(packet.interactionDiagnostics?.resolver)}`);
      assert.notEqual(packet.acceptanceRegistration.status, 'confirmed', 'a receipt is not a granted decision');
      if (positive) {
        assert.equal(packet.actionControlProof?.customControlBinding?.kind, 'direct_onclick', variant);
        const projection = projectPostAcceptEvidenceForReport({ packet, packetSha256: createHash('sha256').update(JSON.stringify(packet)).digest('hex') });
        assert.equal(projection.execution?.status, 'succeeded', variant);
        assert.deepEqual(projection.actionControlProof?.customControlBinding, packet.actionControlProof?.customControlBinding);
        const persisted = postAcceptReportProjectionSchema.parse(JSON.parse(JSON.stringify(projection)));
        assert.deepEqual(persisted.actionControlProof?.customControlBinding, projection.actionControlProof?.customControlBinding);
        assert.deepEqual(persisted.execution, projection.execution);
        assert.ok(packet.timing.resolverMs < 1800, variant);
        assert.ok(!JSON.stringify(packet).includes('window.performConsentChoice'));
        t.diagnostic(`${variant}: resolver=${packet.timing.resolverMs}ms, lane=${packet.timing.totalMs}ms`);
      }
      if (['delegated', 'pointer', 'form'].includes(variant)) {
        assert.ok(packet.interactionDiagnostics?.resolver?.snapshots.some(row => row.state === 'control_binding_unverified'), variant);
      }
    }
  } finally {
    await browser.close(); server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
