import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { ElementHandle, Page } from "playwright";

/** Capture current pixels without Playwright's page-wide font/stability wait.
 * Redact every input rectangle before the image can leave this function. A
 * changed document/layout or unbounded control inventory discards the image. */
export async function captureMaskedFormScreenshot(page: Page, element: ElementHandle, timeoutMs: number): Promise<Buffer> {
  const deadline = Date.now() + timeoutMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const acquisition = page.context().newCDPSession(page);
  let acquisitionTimer: ReturnType<typeof setTimeout> | undefined;
  const session = await Promise.race([acquisition, new Promise<never>((_, reject) => {
    acquisitionTimer = setTimeout(() => reject(new Error("Form screenshot session deadline")), Math.max(1, deadline - Date.now()));
  })]).catch(error => {
    void acquisition.then(client => client.detach()).catch(() => {});
    throw error;
  }).finally(() => { if (acquisitionTimer) clearTimeout(acquisitionTimer); });
  let stage = "pause_animation";
  let style: Awaited<ReturnType<Page["evaluateHandle"]>> | undefined;
  const cleanupStyle = async () => {
    await style?.evaluate((state: any) => {
      if (!state) return;
      state.node.remove();
      if (state.previous === null) state.root.removeAttribute(state.attribute);
      else state.root.setAttribute(state.attribute, state.previous);
      scrollTo({ left: state.position.x, top: state.position.y, behavior: "instant" });
    }).catch(() => {});
    await style?.dispose().catch(() => {});
  };
  try {
    return await Promise.race([
      (async () => {
        style = await element.evaluateHandle((root, { deadlineAtMs, marker }) => {
          if (Date.now() >= deadlineAtMs || !(root instanceof Element)) return null;
          const position = { x: scrollX, y: scrollY };
          const attribute = "data-certscore-form-capture";
          const previous = root.getAttribute(attribute);
          root.setAttribute(attribute, marker);
          const node = document.createElement("style");
          const scope = `[${attribute}="${marker}"]`;
          node.textContent = `${scope},${scope} *,${scope}::before,${scope}::after,${scope} *::before,${scope} *::after{animation-play-state:paused!important;transition-property:none!important;caret-color:transparent!important}`;
          document.documentElement.appendChild(node);
          root.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
          return { node, root, attribute, previous, position };
        }, { deadlineAtMs: deadline, marker: randomUUID() });
        if (Date.now() >= deadline) {
          await cleanupStyle();
          throw new Error("Form screenshot deadline");
        }
        const readLayout = () => element.evaluate(root => {
          const rect = (el: Element) => {
            const r = el.getBoundingClientRect();
            return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
          };
          const controls = document.querySelectorAll('input, textarea, select, [role="checkbox"], [role="switch"], [contenteditable]');
          if (!(root instanceof Element) || !root.isConnected || controls.length > 1000) throw new Error("Form screenshot binding unavailable");
          return { url: location.href, viewport: { x: scrollX, y: scrollY, width: innerWidth, height: innerHeight }, bounds: rect(root), masks: Array.from(controls, rect) };
        });
        stage = "read_layout";
        const before = await readLayout();
        if (Date.now() >= deadline) throw new Error("Form screenshot deadline");
        const clip = before.bounds;
        if (clip.width <= 0 || clip.height <= 0 || clip.width * clip.height > 40_000_000) throw new Error("Form screenshot bounds unavailable");
        stage = "capture_pixels";
        const captured = await session.send("Page.captureScreenshot", {
          format: "jpeg", quality: 45, fromSurface: true, optimizeForSpeed: true,
          captureBeyondViewport: !(clip.x >= before.viewport.x && clip.y >= before.viewport.y && clip.x + clip.width <= before.viewport.x + before.viewport.width && clip.y + clip.height <= before.viewport.y + before.viewport.height),
          clip: { ...clip, scale: Math.min(1, 640 / clip.width, 960 / clip.height) },
        });
        stage = "verify_layout";
        const after = await readLayout();
        if (JSON.stringify(before) !== JSON.stringify(after) || Date.now() >= deadline) throw new Error("Form screenshot layout changed");
        stage = "mask_pixels";
        const raw = Buffer.from(captured.data, "base64");
        const metadata = await sharp(raw, { limitInputPixels: 40_000_000 }).metadata();
        if (!metadata.width || !metadata.height) throw new Error("Form screenshot dimensions unavailable");
        const sx = metadata.width / clip.width, sy = metadata.height / clip.height;
        const overlays = before.masks.flatMap(r => {
          if (r.width <= 0 || r.height <= 0) return [];
          const left = Math.max(0, Math.floor((r.x - clip.x - 2) * sx));
          const top = Math.max(0, Math.floor((r.y - clip.y - 2) * sy));
          const right = Math.min(metadata.width!, Math.ceil((r.x + r.width - clip.x + 2) * sx));
          const bottom = Math.min(metadata.height!, Math.ceil((r.y + r.height - clip.y + 2) * sy));
          if (right <= left || bottom <= top) return [];
          return [{ input: { create: { width: right - left, height: bottom - top, channels: 3 as const, background: "#94a3b8" } }, left, top }];
        });
        const result = await sharp(raw).composite(overlays).jpeg({ quality: 45 }).toBuffer();
        if (Date.now() >= deadline) throw new Error("Form screenshot deadline");
        return result;
      })(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Form screenshot deadline")), Math.max(1, deadline - Date.now())); }),
    ]);
  } catch (error) {
    const code = error instanceof Error && error.message.startsWith("Form screenshot ")
      ? error.message.slice(0, 100) : "browser_operation_failed";
    console.warn("[form-snapshot-capture]", JSON.stringify({ stage, code, deadlineExpired: Date.now() >= deadline }));
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
    // Detaching also stops a timed-out CDP operation; no late image is retained.
    await session.detach().catch(() => {});
    await cleanupStyle();
  }
}
