import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ReportInventorySummary } from "./report-inventory-summary";

test("identified services lead while repeated event counts and neutral unknowns stay in closed details", () => {
  const html = renderToStaticMarkup(<ReportInventorySummary metrics={[{
    label: "Network requests", value: 805,
    counts: { nonEssential: 0, review: 2, unclassified: 535, contextual: 268, essential: 0 },
    overview: { identifiedServices: 3, distinctResources: 80, unattributedResources: 21 },
  }]} />);
  assert.match(html, /Identified services/);
  assert.match(html, /80 distinct network resources/);
  assert.match(html, /21 resources have no identified service/);
  assert.match(html, /<details[^>]*><summary[^>]*>Request activity/);
  assert.doesNotMatch(html, /<details[^>]*open/);
  assert.match(html, />805</);
  assert.match(html, /Purpose unclassified/);
  assert.match(html, /Classification review/);
  assert.match(html, /These counts are not findings/);
  assert.doesNotMatch(html, /Needs review/);
});

test("missing request evidence does not imply zero identified services or invent a classification", () => {
  const html = renderToStaticMarkup(<ReportInventorySummary metrics={[{ label: "Network requests", value: null }]} />);
  assert.doesNotMatch(html, /Identified services|Purpose unclassified|<details|>0</);
});
