import assert from "node:assert/strict";
import test from "node:test";
import { tableRowViewportHeight } from "./use-table-row-limit";

test("a short expanded table can reserve a four-row viewport", () => {
  assert.equal(tableRowViewportHeight({
    contentOffset: 0,
    headerHeight: 30,
    rowHeights: [40],
    limit: 3,
    minimumRows: 4,
  }), 192);
});

test("reserved rows use the tallest visible row and do not change the default limit", () => {
  assert.equal(tableRowViewportHeight({
    contentOffset: 5,
    headerHeight: 30,
    rowHeights: [40, 50, 45],
    limit: 3,
    minimumRows: 4,
  }), 222);
  assert.equal(tableRowViewportHeight({
    contentOffset: 5,
    headerHeight: 30,
    rowHeights: [40, 50, 45, 60],
    limit: 3,
  }), 172);
});
