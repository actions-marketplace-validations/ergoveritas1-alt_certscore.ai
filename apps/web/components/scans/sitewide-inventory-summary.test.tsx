import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SitewideInventorySummary } from "./sitewide-inventory-summary";
import { InventoryEvidenceLegend } from "./inventory-evidence-icon";
import { inventoryTypeBreakdown } from "../../lib/scans/inventory-resource-semantics";

test("type mix groups storage and uses the overview order without changing totals", () => {
  const types = [{ label: "embed", count: 3 }, { label: "storage", count: 2 }, { label: "cookie", count: 1 }, { label: "request", count: 196 }];
  assert.deepEqual(inventoryTypeBreakdown(types), [
    { label: "Requests", count: 196 }, { label: "Cookies & storage", count: 3 }, { label: "Embedded frames", count: 3 },
  ]);
  const html = renderToStaticMarkup(<SitewideInventorySummary mix={{ type: types, evidence: [], purpose: [], relationship: [] }} />);
  assert.match(html, /202 distinct resources = 196 requests \+ 3 cookies &amp; storage \+ 3 embedded frames/);
  const legend = html.slice(html.indexOf('<ul'), html.indexOf('</ul>'));
  assert.ok(legend.indexOf('>Requests<') < legend.indexOf('>Cookies &amp; storage<'));
  assert.ok(legend.indexOf('>Cookies &amp; storage<') < legend.indexOf('>Embedded frames<'));
  assert.doesNotMatch(html, /Network requests|Embedded content|capitalize/);
});

test("classification chart and legend share the overview classification order", () => {
  const labels = ["Essential", "Contextual", "Unclassified", "Review", "Non-essential"];
  const chart = renderToStaticMarkup(<SitewideInventorySummary mix={{ type: [], evidence: labels.map(label => ({ label, count: 1 })), purpose: [], relationship: [] }} />);
  const legend = renderToStaticMarkup(<InventoryEvidenceLegend />);
  for (const html of [chart, legend]) {
    const positions = ["Non-essential", "Classification review", "Unknown purpose", "Contextual", "Essential"].map(label => html.indexOf(`>${label}<`));
    assert.ok(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1]!)));
  }
});
