import type { BrowserContext } from "playwright";
import { parseGpcGppPing } from "./gpc-gpp-parser.js";

/** Bounded passive listener; no global API replacement, timers, clicks or polling. */
export async function installGpcSemanticMonitor(context: BrowserContext, key: string) {
  function bootstrap(key: string, parse: typeof parseGpcGppPing) {
    if (window !== window.top) return;
    const w = window as unknown as Record<string, any>;
    let closed = false, attempts = 0, listenerId: number | null = null, api: any;
    let callbacks = 0, dropped = 0, checks = 0;
    const startedAt = Date.now();
    const history: Array<{ at: number; status: string; state: unknown; diagnosticCodes?: string[] }> = [];
    let observer: MutationObserver | undefined;
    const onEvent = (event: any, success: boolean) => {
      if (closed) return;
      if (++callbacks > 64) { dropped++; return; }
      if (success !== true || !event || typeof event !== "object") return;
      if (event.eventName === "listenerRegistered" && event.data === true && Number.isInteger(event.listenerId) && event.listenerId > 0) listenerId = event.listenerId;
      if (!["listenerRegistered", "signalStatus", "sectionChange", "cmpStatus"].includes(event.eventName)) return;
      const value = parse(event.pingData);
      const previous = history.at(-1);
      if (previous && previous.status === value.status && JSON.stringify(previous.state) === JSON.stringify(value.state) &&
        JSON.stringify(previous.diagnosticCodes) === JSON.stringify(value.diagnosticCodes)) return;
      if (history.length >= 16) { dropped++; history.shift(); }
      history.push({ at: Date.now(), ...value });
    };
    const attach = (lifecycle = false) => {
      if (closed || (api && api === w.__gpp)) return;
      if ((!lifecycle && ++checks > 128) || attempts >= 2) { observer?.disconnect(); return; }
      if (typeof w.__gpp !== "function") return;
      // A queued stub can be replaced by the loaded CMP. Keep the bounded
      // lifecycle hooks and attach to the new API, without wrapping its global.
      if (api && listenerId !== null) { try { api("removeEventListener", () => {}, listenerId); } catch {} }
      listenerId = null;
      api = w.__gpp; attempts++;
      const attachedApi = api;
      try { api("addEventListener", (event: any, success: boolean) => { if (api === attachedApi) onEvent(event, success); }); } catch { api = undefined; }
      if (api) observer?.disconnect();
      // Mutation observation is bounded; load/DOMContentLoaded/terminal hooks
      // still detect API replacement after the mutation budget is exhausted.
    };
    const onLifecycle = () => attach(true);
    document.addEventListener("DOMContentLoaded", onLifecycle);
    document.addEventListener("load", onLifecycle, true);
    observer = new MutationObserver(() => attach());
    observer.observe(document, { childList: true, subtree: true });
    attach();
    Object.defineProperty(w, key, { configurable: false, value: {
      checkpoint: onLifecycle,
      finish: () => {
        attach(true); closed = true; observer?.disconnect();
        document.removeEventListener("DOMContentLoaded", onLifecycle);
        document.removeEventListener("load", onLifecycle, true);
        if (api && listenerId !== null) { try { api("removeEventListener", () => {}, listenerId); } catch {} }
        return { startedAt, endedAt: Date.now(), callbacks, dropped, listenerRegistered: listenerId !== null, history };
      },
    } });
  }
  // tsx can emit __name helpers inside serialized functions; keep that harmless
  // helper lexical without modifying any website global.
  await context.addInitScript({ content: `(() => { const __name = (fn) => fn; (${bootstrap.toString()})(${JSON.stringify(key)}, (${parseGpcGppPing.toString()})); })();` });
}
