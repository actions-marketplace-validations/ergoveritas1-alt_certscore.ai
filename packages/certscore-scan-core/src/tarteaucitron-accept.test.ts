import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import test from "node:test";
import { chromium } from "playwright";
import { projectPostAcceptEvidenceForReport } from "@certscore/contracts";
import { buildCanonicalPostAcceptActionRecipes } from "./post-accept-cmp-recipes.js";
import { runPostAcceptObserver } from "./post-accept-observer.js";

test("registered DSGVO Accept span completes one bounded path without inventing consent confirmation", async () => {
  const recipes = buildCanonicalPostAcceptActionRecipes();
  const recipe = recipes.find(row => row.cmpId === "DSGVO All in One / tarteaucitron");
  assert.ok(recipe);
  let clicks = 0;
  let variant = "accept";
  const server = createServer((request, response) => {
    if (request.url === "/clicked") { clicks += 1; response.writeHead(204).end(); return; }
    response.setHeader("content-type", "text/html; charset=utf-8");
    const control = `<span id="tarteaucitronPersonalize" style="display:block;width:300px;height:40px" onclick="${variant === "reload" ? "location.reload();" : "tarteaucitron.userInterface.respondAll(true);"}">${variant === "preferences" ? "Personalisieren" : "✓ Akzeptieren"}</span>`;
    response.end(`<!doctype html><html lang="de"><body>
      <div id="tarteaucitronRoot"><div id="tarteaucitronAlertBig">
      <p>Cookie-Einstellungen: Wir verwenden Cookies für Analyse und Werbung.</p>
      ${variant === "outside" ? "" : control}${variant === "duplicate" ? control : ""}
      </div></div>${variant === "outside" ? control : ""}
      <script>window.tarteaucitron={userInterface:{respondAll:function(){fetch('/clicked');document.querySelector('#tarteaucitronAlertBig').hidden=true;}}};</script>
      </body></html>`);
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const browser = await chromium.launch({ headless: true });
  try {
    for (variant of ["accept", "reload", "preferences", "duplicate", "outside"]) {
      clicks = 0;
      const packet = await runPostAcceptObserver({
        browser, actionSearchTimeoutMs: 1500, confirmationTimeoutMs: 100, observationWindowMs: 250,
        interactionAuthorization: { authorizationId: "loopback_local_lab", kind: "loopback" },
        allowCanonicalAcceptDiscovery: true, productionProjectable: true,
        recipe, recipeCandidates: recipes,
        scanId: `tarteaucitron-${variant}`, url: `http://127.0.0.1:${address.port}/`,
      });
      assert.equal(clicks, variant === "accept" ? 1 : 0, variant);
      assert.notEqual(packet.acceptanceRegistration.status, "confirmed", "banner disappearance is not consent registration");
      if (variant === "accept") {
        assert.equal(packet.actionControlProof?.action, "accept");
        assert.equal(packet.actionControlProof?.accessibleLabel, "✓ Akzeptieren");
        assert.ok(packet.timing.observationMs > 0);
        assert.ok(packet.timing.resolverMs < 1500);
        assert.equal(projectPostAcceptEvidenceForReport({ packet,
          packetSha256: createHash("sha256").update(JSON.stringify(packet)).digest("hex"),
        }).execution?.status, "succeeded");
      }
    }
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
