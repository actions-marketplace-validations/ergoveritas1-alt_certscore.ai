import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import sharp from "sharp";
import { buildCollectionSurfaceInventory } from "./collection-surface-inventory";
import { captureCollectionSurfaceSnapshots } from "./collection-surface-snapshots";

test("form crops retain binding, mask inputs, resize, and fail closed on unsafe or mismatched documents", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await page.setContent('<form style="width:1000px;height:300px;background:white"><label>Email<input type="email" value="private@example.test" style="display:block;width:400px;height:80px"></label></form>');
    const inventory = buildCollectionSurfaceInventory({ pageUrl: "about:blank", inspectedFieldCandidateCount: 1, candidateScanTruncated: false, rows: [{ groupKey: "native_form_0", structure: "native_form", elementType: "input", inputType: "email", label: "Email", required: false, disabled: false, readOnly: false, domOrder: 0 }] }, Date.now());
    let reviewed = 0;
    const snapshots = await captureCollectionSurfaceSnapshots(page, inventory, async ({ bytes }) => {
      reviewed++;
      const metadata = await sharp(bytes).metadata();
      assert.equal(metadata.width, 640); assert.ok(metadata.height! <= 960);
      return { safeForDisplay: true };
    });
    assert.equal(reviewed, 1);
    assert.equal(snapshots[0]?.status, "available");
    assert.equal(snapshots[0]?.formRef, inventory.forms[0]?.formRef);
    assert.ok(snapshots[0]?.data);
    assert.ok(snapshots[0]!.sizeBytes! < 96 * 1024);
    const pixels = await sharp(Buffer.from(snapshots[0]!.data!, "base64")).raw().toBuffer({ resolveWithObject: true });
    // The center of the input is covered with the prescribed neutral mask.
    const offset = (40 * pixels.info.width + 100) * pixels.info.channels;
    assert.ok(Math.abs(pixels.data[offset]! - 148) < 8);
    assert.ok(Math.abs(pixels.data[offset + 1]! - 163) < 8);
    assert.ok(Math.abs(pixels.data[offset + 2]! - 184) < 8);
    const withheld = await captureCollectionSurfaceSnapshots(page, inventory, async () => ({ safeForDisplay: false }));
    assert.equal(withheld[0]?.status, "withheld"); assert.equal(withheld[0]?.data, undefined);
    const failed = await captureCollectionSurfaceSnapshots(page, inventory, async () => { throw new Error("Review unavailable"); });
    assert.equal(failed[0]?.status, "unavailable"); assert.equal(failed[0]?.data, undefined);
    const mismatch = await captureCollectionSurfaceSnapshots(page, { ...inventory, pageUrl: "https://different.test" }, async () => { throw new Error("Must not review mismatched document"); });
    assert.equal(mismatch[0]?.status, "unavailable");
    await page.setContent('<section><label>Email<input type="email" style="width:200px;height:40px"></label></section>');
    const standalone = { ...inventory, forms: inventory.forms.map(form => ({ ...form, structure: "unassociated_controls" as const })) };
    assert.equal((await captureCollectionSurfaceSnapshots(page, standalone, async () => ({ safeForDisplay: true })))[0]?.status, "available");
    await page.setContent('<form id="contact"><p>Contact</p></form><label>Email<input form="contact" type="email" style="width:200px;height:40px"></label>');
    assert.equal((await captureCollectionSurfaceSnapshots(page, inventory, async () => ({ safeForDisplay: true })))[0]?.status, "available");
  } finally { await browser.close(); }
});

test("animated forms capture within the existing budget and stalled review terminates with a retained reason", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.setContent('<style>@keyframes move{from{transform:translateX(0)}to{transform:translateX(80px)}}form{animation:move 10s infinite alternate;width:300px;height:100px;background:white}</style><form><label>Search<input type="text"></label></form>');
    const inventory = buildCollectionSurfaceInventory({ pageUrl: "about:blank", inspectedFieldCandidateCount: 1, candidateScanTruncated: false, rows: [{ groupKey: "native_form_0", structure: "native_form", elementType: "input", inputType: "text", label: "Search", required: false, disabled: false, readOnly: false, domOrder: 0 }] }, Date.now());
    assert.equal((await captureCollectionSurfaceSnapshots(page, inventory, async () => ({ safeForDisplay: true })))[0]?.status, "available");
    const started = Date.now();
    const stalled = await captureCollectionSurfaceSnapshots(page, inventory, () => new Promise(() => {}));
    assert.equal(stalled[0]?.reason, "review_timed_out");
    assert.equal(stalled[0]?.data, undefined);
    assert.ok(Date.now() - started < 4500, "review must not hang beyond the existing 2.5s budget plus scheduling tolerance");
    await page.locator('form').evaluate(el => (el as HTMLElement).style.display = 'none');
    const hidden = await captureCollectionSurfaceSnapshots(page, inventory, async () => { throw new Error('must not review'); });
    assert.equal(hidden[0]?.reason, "form_not_visible");
    const controller = new AbortController(); controller.abort();
    assert.equal((await captureCollectionSurfaceSnapshots(page, inventory, async () => ({ safeForDisplay: true }), controller.signal))[0]?.reason, "capture_cancelled");
  } finally { await browser.close(); }
});

test("pending page fonts cannot prevent a masked form snapshot", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.route('https://fonts.example.test/pending.woff2', () => new Promise(() => {}));
    await page.setContent('<style>@font-face{font-family:pending;src:url(https://fonts.example.test/pending.woff2)}form{font-family:pending;width:300px;height:100px}</style><form><label>Search<input type="text" value="private-value"></label></form>', { waitUntil: 'domcontentloaded' });
    const inventory = buildCollectionSurfaceInventory({ pageUrl: 'about:blank', inspectedFieldCandidateCount: 1, candidateScanTruncated: false, rows: [{ groupKey: 'native_form_0', structure: 'native_form', elementType: 'input', inputType: 'text', label: 'Search', required: false, disabled: false, readOnly: false, domOrder: 0 }] }, Date.now());
    const result = await captureCollectionSurfaceSnapshots(page, inventory, async () => ({ safeForDisplay: true }));
    assert.equal(result[0]?.status, 'available');
    assert.equal(result[0]?.valuesMasked, true);
    assert.equal(await page.locator('input').inputValue(), 'private-value');
  } finally { await browser.close(); }
});

test("a form layout change during capture discards pixels before review", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.setContent('<form style="width:400px;height:150px"><label>Search<input type="text"></label></form>');
    const context = page.context();
    const createSession = context.newCDPSession.bind(context);
    context.newCDPSession = async (...args) => {
      const session = await createSession(...args);
      const send = session.send.bind(session);
      session.send = (async (method: string, params: unknown) => {
        const result = await (send as Function)(method, params);
        if (method === 'Page.captureScreenshot') await page.locator('input').evaluate(el => (el as HTMLElement).style.marginLeft = '50px');
        return result;
      }) as typeof session.send;
      return session;
    };
    const inventory = buildCollectionSurfaceInventory({ pageUrl: 'about:blank', inspectedFieldCandidateCount: 1, candidateScanTruncated: false, rows: [{ groupKey: 'native_form_0', structure: 'native_form', elementType: 'input', inputType: 'text', label: 'Search', required: false, disabled: false, readOnly: false, domOrder: 0 }] }, Date.now());
    let reviewed = false;
    const result = await captureCollectionSurfaceSnapshots(page, inventory, async () => { reviewed = true; return { safeForDisplay: true }; });
    assert.equal(result[0]?.status, 'unavailable');
    assert.equal(result[0]?.data, undefined);
    assert.equal(reviewed, false);
    assert.equal(await page.locator('style').count(), 0, 'temporary animation styling must be removed');
  } finally { await browser.close(); }
});


test("footer form capture uses off-screen pixels without scrolling", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await page.setContent('<main style="height:18000px;animation-play-state:running"></main><form data-certscore-form-capture="existing" style="width:400px;height:100px"><label>Search<input type="text" value="private"></label></form>');
    await page.evaluate(() => addEventListener("scroll", () => {
      document.querySelector("form")!.style.width = "420px";
    }, { once: true }));
    const createSession = page.context().newCDPSession.bind(page.context());
    let beyond: boolean | undefined;
    page.context().newCDPSession = async (...args) => {
      const session = await createSession(...args), send = session.send.bind(session);
      session.send = (async (method: string, params: any) => { if (method === "Page.captureScreenshot") {
        beyond = params.captureBeyondViewport;
        assert.equal(params.optimizeForSpeed, true);
        assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).animationPlayState), 'running');
        assert.equal(await page.locator('form').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
      } return (send as Function)(method, params); }) as typeof session.send;
      return session;
    };
    const inventory = buildCollectionSurfaceInventory({ pageUrl: 'about:blank', inspectedFieldCandidateCount: 1, candidateScanTruncated: false, rows: [{ groupKey: 'native_form_0', structure: 'native_form', elementType: 'input', inputType: 'text', label: 'Search', required: false, disabled: false, readOnly: false, domOrder: 0 }] }, Date.now());
    const result = await captureCollectionSurfaceSnapshots(page, inventory, async () => ({ safeForDisplay: true }));
    assert.equal(result[0]?.status, "available");
    assert.equal(beyond, true);
    assert.equal(await page.locator("form").getAttribute("data-certscore-form-capture"), "existing");
    assert.equal(await page.evaluate(() => scrollY), 0);
    assert.equal(await page.locator("input").inputValue(), "private");
  } finally { await browser.close(); }
});

test("masked capture can finish after one second inside the unchanged total budget", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.setContent('<form style="width:400px;height:150px"><label>Search<input type="text" value="private"></label></form>');
    const createSession = page.context().newCDPSession.bind(page.context());
    page.context().newCDPSession = async (...args) => {
      const session = await createSession(...args), send = session.send.bind(session);
      session.send = (async (method: string, params: unknown) => {
        if (method === "Page.captureScreenshot") await new Promise(resolve => setTimeout(resolve, 1600));
        return (send as Function)(method, params);
      }) as typeof session.send;
      return session;
    };
    const inventory = buildCollectionSurfaceInventory({ pageUrl: "about:blank", inspectedFieldCandidateCount: 1, candidateScanTruncated: false, rows: [{ groupKey: "native_form_0", structure: "native_form", elementType: "input", inputType: "text", label: "Search", required: false, disabled: false, readOnly: false, domOrder: 0 }] }, Date.now());
    const result = await captureCollectionSurfaceSnapshots(page, inventory, async () => ({ safeForDisplay: true }));
    assert.equal(result[0]?.status, "available");
    assert.equal(result[0]?.valuesMasked, true);
    assert.ok(result[0]?.data);
    assert.equal(await page.locator("input").inputValue(), "private");
  } finally { await browser.close(); }
});

test("changes to controls outside retained pixels do not invalidate a form crop", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.setContent('<form style="width:400px;height:150px"><label>Search<input type="text"></label></form><input id="outside" style="position:absolute;top:700px">');
    let enterCrop = false;
    const createSession = page.context().newCDPSession.bind(page.context());
    page.context().newCDPSession = async (...args) => {
      const session = await createSession(...args), send = session.send.bind(session);
      session.send = (async (method: string, params: unknown) => {
        const result = await (send as Function)(method, params);
        if (method === "Page.captureScreenshot") await page.locator("#outside").evaluate((el, enter) => { (el as HTMLElement).style.left = "50px"; if (enter) (el as HTMLElement).style.top = "30px"; }, enterCrop);
        return result;
      }) as typeof session.send;
      return session;
    };
    const inventory = buildCollectionSurfaceInventory({ pageUrl: "about:blank", inspectedFieldCandidateCount: 1, candidateScanTruncated: false, rows: [{ groupKey: "native_form_0", structure: "native_form", elementType: "input", inputType: "text", label: "Search", required: false, disabled: false, readOnly: false, domOrder: 0 }] }, Date.now());
    assert.equal((await captureCollectionSurfaceSnapshots(page, inventory, async () => ({ safeForDisplay: true })))[0]?.status, "available");
    enterCrop = true;
    let reviewed = false;
    const changed = await captureCollectionSurfaceSnapshots(page, inventory, async () => { reviewed = true; return { safeForDisplay: true }; });
    assert.equal(changed[0]?.status, "unavailable");
    assert.equal(changed[0]?.data, undefined);
    assert.equal(reviewed, false);
  } finally { await browser.close(); }
});
