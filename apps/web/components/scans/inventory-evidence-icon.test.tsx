import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { InventoryEvidenceIcon, InventoryEvidenceLegend } from "./inventory-evidence-icon";

test("classification icons have distinct shapes, accessible labels, and no button semantics", () => {
  const paths = new Set<string>();
  for (const evidence of ["Non-essential", "Essential", "Review", "Contextual", "Unclassified"]) {
    const html = renderToStaticMarkup(<InventoryEvidenceIcon evidence={evidence}/>);
    assert.match(html, /role="img"/);
    assert.match(html, /tabindex="0"/);
    assert.ok(html.includes(evidence === "Review" ? "Classification review" : evidence === "Unclassified" ? "Purpose unclassified" : evidence));
    assert.doesNotMatch(html, /<button/);
    const path = html.match(/<path d="([^"]+)"/)?.[1];
    assert.ok(path);
    paths.add(path);
  }
  assert.equal(paths.size, 5);
  for (const evidence of [undefined, "Unknown", "toString"]) {
    const blank = renderToStaticMarkup(<InventoryEvidenceIcon evidence={evidence}/>);
    assert.match(blank, /h-4 w-4 shrink-0/);
    assert.match(blank, /aria-hidden="true"/);
    assert.doesNotMatch(blank, /<svg|tabindex|Unclassified/);
  }
  assert.match(renderToStaticMarkup(<InventoryEvidenceLegend/>), /Purpose unclassified/);
  assert.match(renderToStaticMarkup(<InventoryEvidenceLegend/>), /Evidence classification legend/);
});
